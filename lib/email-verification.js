// SafarOS email OTP verification for new agency owners.
import crypto from 'crypto';
import { sendEmail, isEmailConfigured, configuredBaseUrl, emailLayout } from '@/lib/email';

const CODES = 'emailVerificationCodes';
const REQUESTS = 'emailVerificationRequests';
const sha = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_PER_HOUR = 5;

export async function issueSignupOtp(db, { email, name, agencyId, ip = '' }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!(await isEmailConfigured(db, agencyId))) {
    return { ok: false, error: 'Email delivery is not configured yet. Please contact support.' };
  }
  const nowMs = Date.now();
  const since = new Date(nowMs - 60 * 60 * 1000).toISOString();
  const emailHash = sha(normalized);
  const recent = await db.collection(REQUESTS).countDocuments({ emailHash, createdAt: { $gt: since } });
  if (recent >= MAX_PER_HOUR) return { ok: false, error: 'Too many verification emails. Please try again later.' };
  const latest = await db.collection(CODES).findOne({ email: normalized, consumedAt: null }, { sort: { createdAt: -1 } });
  if (latest && nowMs - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: 'Please wait 60 seconds before requesting another code.' };
  }
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const now = new Date(nowMs).toISOString();
  await db.collection(CODES).updateMany({ email: normalized, consumedAt: null }, { $set: { consumedAt: now, invalidated: true } });
  await db.collection(CODES).insertOne({
    id: crypto.randomUUID(), email: normalized, agencyId, codeHash: sha(normalized + ':' + otp),
    attempts: 0, consumedAt: null, expiresAt: new Date(nowMs + OTP_TTL_MS).toISOString(), createdAt: now,
  });
  await db.collection(REQUESTS).insertOne({ id: crypto.randomUUID(), emailHash, ipHash: ip ? sha(ip) : '', createdAt: now });
  const base = await configuredBaseUrl(db);
  const greeting = String(name || 'there').replace(/[<>]/g, '').slice(0, 80);
  const result = await sendEmail(db, {
    to: normalized, agencyId, subject: 'Your SafarOS verification code',
    html: emailLayout('Verify your email', `<p>Hello ${greeting},</p><p>Use this six-digit code to complete your SafarOS signup:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes and can only be used once.</p><p>If you did not start this signup, you can ignore this email.</p>`),
    text: `Hello ${greeting}, your SafarOS verification code is ${otp}. It expires in 10 minutes and can only be used once.`,
  });
  if (!result?.ok) {
    await db.collection(CODES).updateMany({ email: normalized, consumedAt: null }, { $set: { consumedAt: now, invalidated: true } });
    return { ok: false, error: 'We could not send your verification email. Please try again shortly.' };
  }
  return { ok: true, message: 'A verification code has been sent to your email address.' };
}

export async function verifySignupOtp(db, { email, otp }) {
  const normalized = String(email || '').trim().toLowerCase();
  const code = String(otp || '').trim();
  if (!/^\\d{6}$/.test(code)) return { ok: false, error: 'Enter the six-digit verification code.' };
  const now = new Date().toISOString();
  const doc = await db.collection(CODES).findOne({ email: normalized, consumedAt: null, expiresAt: { $gt: now } }, { sort: { createdAt: -1 } });
  if (!doc) return { ok: false, error: 'This code has expired or is invalid. Request a new code.' };
  if (Number(doc.attempts || 0) >= MAX_ATTEMPTS) return { ok: false, error: 'Too many incorrect attempts. Request a new code.' };
  if (doc.codeHash !== sha(normalized + ':' + code)) {
    await db.collection(CODES).updateOne({ id: doc.id, consumedAt: null, attempts: { $lt: MAX_ATTEMPTS } }, { $inc: { attempts: 1 } });
    return { ok: false, error: 'Incorrect verification code.' };
  }
  const consumed = await db.collection(CODES).findOneAndUpdate(
    { id: doc.id, consumedAt: null, expiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
    { $set: { consumedAt: now, verifiedAt: now } },
  );
  const tokenDoc = consumed?.value !== undefined ? consumed.value : consumed;
  if (!tokenDoc) return { ok: false, error: 'This code has already been used. Request a new code.' };
  const user = await db.collection('users').findOne({ email: normalized, status: 'pending_verification' });
  if (!user) return { ok: false, error: 'No pending signup was found for this email. Please sign up again.' };
  const activated = await db.collection('users').updateOne(
    { id: user.id, status: 'pending_verification' },
    { $set: { status: 'active', emailVerified: true, emailVerifiedAt: now, updatedAt: now } },
  );
  if (!activated.modifiedCount) return { ok: false, error: 'This account has already been verified. Please sign in.' };
  await db.collection('agencies').updateOne({ id: user.agencyId, status: 'pending_verification' }, { $set: { status: 'active', updatedAt: now } });
  await db.collection(CODES).updateMany({ email: normalized, consumedAt: null }, { $set: { consumedAt: now, invalidated: true } });
  const base = await configuredBaseUrl(db);
  await sendEmail(db, {
    to: normalized, agencyId: user.agencyId, subject: 'Welcome to SafarOS',
    html: emailLayout('Welcome to SafarOS', '<p>Your email is verified and your workspace is ready.</p><p>You can now sign in and start managing your travel business with SafarOS.</p>' + (base ? `<p><a href="${base}/login">Open SafarOS</a></p>` : '')),
    text: `Your email is verified and your SafarOS workspace is ready. ${base ? base + '/login' : ''}`,
  });
  return { ok: true, user: { id: user.id, agencyId: user.agencyId, role: user.role } };
}
