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
  const since = new Date(nowMs - 60 * 60 * 1000).toISOString();
  const recent = await db.collection(COLLECTION).countDocuments({ email, lastSentAt: { $gt: since } });
  if (recent >= 5) return { ok: false, status: 429, error: 'Too many verification attempts. Please try again later.' };

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
  };
  await db.collection(COLLECTION).updateOne({ email }, { $set: doc }, { upsert: true });
  const sent = await sendEmail(db, {
    to: email,
    subject: 'Verify your SafarOS email address',
    html: emailLayout('Verify your email address', `<p>Use this one-time code to finish creating your SafarOS workspace:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px;color:#6d28d9">${code}</p><p>This code expires in 10 minutes and can be used once. If you did not request this, you can ignore this email.</p>`),
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
