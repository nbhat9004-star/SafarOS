import crypto from 'crypto';
import { sendEmail, emailLayout, isEmailConfigured, EMAIL_ADDR_RE } from '@/lib/email';

const COLLECTION = 'pendingAgencyRegistrations';
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_WAIT_MS = 60 * 1000;
const sha = (salt, code) => crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');

export async function startAgencyEmailVerification(db, registration) {
  const email = String(registration.email || '').trim().toLowerCase();
  if (!EMAIL_ADDR_RE.test(email)) return { ok: false, status: 400, error: 'Enter a valid email address.' };
  if (!(await isEmailConfigured(db))) return { ok: false, status: 503, error: 'Email verification is not configured yet. Please contact SafarOS support.' };

  const existingUser = await db.collection('users').findOne({ email }, { projection: { _id: 1 } });
  if (existingUser) return { ok: false, status: 409, error: 'This email is already registered. Please sign in instead.' };

  const previous = await db.collection(COLLECTION).findOne({ email, consumedAt: null });
  const nowMs = Date.now();
  if (previous?.lastSentAt && nowMs - new Date(previous.lastSentAt).getTime() < RESEND_WAIT_MS) {
    return { ok: false, status: 429, error: 'Please wait one minute before requesting another code.' };
  }
  const withinHour = previous?.firstSentAt && nowMs - new Date(previous.firstSentAt).getTime() < 60 * 60 * 1000;
  const sendCount = withinHour ? Number(previous.sendCount || 1) + 1 : 1;
  if (sendCount > 5) return { ok: false, status: 429, error: 'Too many verification attempts. Please try again later.' };
  await db.collection(COLLECTION).deleteMany({ expiresAt: { $lte: new Date(nowMs).toISOString() } });

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString('hex');
  const now = new Date(nowMs).toISOString();
  const id = crypto.randomUUID();
  const doc = {
    id, email, name: String(registration.name).trim().slice(0, 100),
    agencyName: String(registration.agencyName).trim().slice(0, 120),
    countryCode: String(registration.countryCode || 'IN').toUpperCase(),
    passwordHash: registration.passwordHash,
    otpSalt: salt, otpHash: sha(salt, code), attempts: 0,
    expiresAt: new Date(nowMs + TTL_MS).toISOString(),
    consumedAt: null, createdAt: now, lastSentAt: now,
    firstSentAt: withinHour ? previous.firstSentAt : now, sendCount,
  };
  await db.collection(COLLECTION).updateOne({ email }, { $set: doc }, { upsert: true });
  const sent = await sendEmail(db, {
    to: email,
    subject: 'Verify your SafarOS email address',
    html: emailLayout('Verify your email address', `<p style="margin:0 0 18px;">You're one step away from your SafarOS workspace. Enter this one-time code to confirm your email address:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#f3f0ff;border:1px solid #e3dcff;border-radius:14px;"><tr><td align="center" style="padding:22px 12px;"><div style="font-size:10px;letter-spacing:2px;font-weight:700;color:#6d5dfc;">YOUR VERIFICATION CODE</div><div style="margin-top:8px;font-size:34px;line-height:1.3;font-weight:700;letter-spacing:9px;color:#5535c8;">${code}</div><div style="margin-top:8px;font-size:12px;color:#6b6683;">Expires in 10 minutes · One-time use</div></td></tr></table><p style="font-size:14px;color:#64748b;">If you didn't request a SafarOS account, you can safely ignore this email.</p>`, { preheader: 'Your SafarOS verification code is ready', eyebrow: 'SECURE ACCOUNT VERIFICATION' }),
    text: `Your SafarOS verification code is ${code}. It expires in 10 minutes and can be used once.`,
  });
  if (!sent.ok) {
    await db.collection(COLLECTION).deleteOne({ id });
    console.warn('[safaros] signup verification email failed:', sent.error || 'Email not configured');
    return { ok: false, status: 503, error: sent.skipped ? 'SafarOS email delivery is not configured. Please contact support.' : 'We could not send your verification email. Please try again later.' };
  }
  return { ok: true, email, expiresInSeconds: TTL_MS / 1000 };
}

export async function verifyAgencyEmailCode(db, emailInput, codeInput) {
  const email = String(emailInput || '').trim().toLowerCase();
  const code = String(codeInput || '').trim();
  if (!EMAIL_ADDR_RE.test(email) || !/^\d{6}$/.test(code)) return { ok: false, error: 'Enter the six-digit code sent to your email.' };
  const now = new Date().toISOString();
  const pending = await db.collection(COLLECTION).findOne({ email, consumedAt: null, expiresAt: { $gt: now } });
  if (!pending) return { ok: false, error: 'This verification code has expired. Please register again or request a new code.' };
  if (pending.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Too many incorrect codes. Please request a new verification code.' };
  const actual = Buffer.from(sha(pending.otpSalt, code), 'hex');
  const expected = Buffer.from(pending.otpHash, 'hex');
  const valid = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  if (!valid) {
    await db.collection(COLLECTION).updateOne({ id: pending.id, consumedAt: null }, { $inc: { attempts: 1 } });
    return { ok: false, error: 'The verification code is incorrect.' };
  }
  const consumed = await db.collection(COLLECTION).updateOne(
    { id: pending.id, otpHash: pending.otpHash, consumedAt: null, expiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
    { $set: { consumedAt: now } },
  );
  if (!consumed.modifiedCount) return { ok: false, error: 'This code has already been used or has expired. Please request a new one.' };
  return { ok: true, registration: pending };
}
