// SafarOS — Password reset for agency users and (separately) platform Super Admins.
//
// - Raw tokens (32 random bytes) exist only inside the emailed link; the DB stores SHA-256 hashes.
// - Tokens are single-use (atomically consumed), expire after 30 minutes, and any older unused
//   token for the same account is invalidated when a new one is issued.
// - Rate-limited per email (3/hour) and per IP (10/hour). Callers always return a generic
//   response so the API never reveals whether an email has an account.
// - Requires email to be configured (lib/email.js). If it is not, requests are a silent no-op.

import crypto from 'crypto';
import { hashPassword } from '@/lib/auth';
import { sendEmail, isEmailConfigured, configuredBaseUrl, emailLayout } from '@/lib/email';

const TOKENS = 'passwordResetTokens';
const REQUESTS = 'passwordResetRequests';
const TTL_MS = 30 * 60 * 1000;
const PER_EMAIL_HOUR = 3;
const PER_IP_HOUR = 10;
const COLLECTION = { agency: 'users', platform: 'platformAdmins' };
const MIN_LEN = { agency: 8, platform: 10 };
const INVALID = 'This reset link is invalid or has expired. Please request a new one.';
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const unwrap = (r) => (r && r.value !== undefined && r.ok !== undefined ? r.value : r);

export const GENERIC_RESET_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

export async function requestPasswordReset(db, kind, rawEmail, ip, purpose = 'reset') {
  try {
    const email = String(rawEmail || '').toLowerCase().trim().slice(0, 200);
    if (!COLLECTION[kind] || !email) return;
    const now = new Date().toISOString(); const since = new Date(Date.now() - 3600e3).toISOString();
    const emailHash = sha(`${kind}:${email}`); const ipHash = ip ? sha(ip) : '';
    const [byEmail, byIp] = await Promise.all([
      db.collection(REQUESTS).countDocuments({ emailHash, createdAt: { $gt: since } }),
      ipHash ? db.collection(REQUESTS).countDocuments({ ipHash, createdAt: { $gt: since } }) : 0,
    ]);
    const limited = byEmail >= PER_EMAIL_HOUR || byIp >= PER_IP_HOUR;
    await db.collection(REQUESTS).insertOne({ id: crypto.randomUUID(), kind, emailHash, ipHash, limited, createdAt: now });
    if (limited) return;
    const acct = await db.collection(COLLECTION[kind]).findOne({ email }, { projection: { _id: 0, id: 1, email: 1, status: 1, agencyId: 1 } });
    if (!acct || (acct.status && acct.status !== 'active')) return;
    const agencyId = kind === 'agency' ? String(acct.agencyId || '') : '';
    if (!(await isEmailConfigured(db, agencyId))) return;
    const base = await configuredBaseUrl(db);
    if (!base) return;
    const raw = crypto.randomBytes(32).toString('hex');
    await db.collection(TOKENS).updateMany({ kind, subjectId: acct.id, usedAt: null }, { $set: { usedAt: now, invalidated: true } });
    await db.collection(TOKENS).insertOne({ id: crypto.randomUUID(), kind, subjectId: acct.id, tokenHash: sha(raw), expiresAt: new Date(Date.now() + TTL_MS).toISOString(), usedAt: null, createdAt: now });
    const link = `${base}/reset-password?type=${kind}&token=${raw}`;
    const who = kind === 'platform' ? 'SafarOS Super Admin' : 'SafarOS';
    const inviting = purpose === 'invite' && kind === 'agency';
    const subject = inviting ? 'You are invited to SafarOS' : 'Reset your SafarOS password';
    const heading = inviting ? 'Set up your SafarOS account' : 'Reset your password';
    const intro = inviting
      ? 'Your agency has invited you to join its SafarOS workspace. Set a password to activate your access.'
      : `We received a request to reset the password for your ${who} account.`;
    const button = inviting ? 'Set my password' : 'Choose a new password';
    const ending = inviting
      ? 'This secure link expires in 30 minutes and works only once. If you were not expecting this invitation, you can ignore this email.'
      : 'This link expires in 30 minutes and works only once. If you did not request it, you can safely ignore this email.';
    await sendEmail(db, {
      to: acct.email, agencyId, subject,
      html: emailLayout(heading, `<p>${intro}</p>`
        + `<p><a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${button}</a></p>`
        + `<p>${ending}</p>`),
      text: `${intro}\n${button}: ${link}\n${ending}`,
    });
  } catch (e) {
    console.warn('[safaros] password reset request failed:', e.message);
  }
}

export async function sendPasswordChangedNotice(db, email) {
  return sendEmail(db, {
    to: email, subject: 'Your SafarOS password was changed',
    html: emailLayout('Your password was changed', '<p>The password for your SafarOS account was just changed.</p><p>If this was not you, reset your password immediately and contact your administrator.</p>'),
    text: 'The password for your SafarOS account was just changed. If this was not you, reset it immediately.',
  }).catch(() => ({ ok: false }));
}

export async function completePasswordReset(db, kind, rawToken, newPassword) {
  const token = String(rawToken || ''); const pw = String(newPassword || '');
  if (!COLLECTION[kind] || !/^[a-f0-9]{64}$/.test(token)) return { ok: false, error: INVALID };
  if (pw.length < MIN_LEN[kind] || pw.length > 200) return { ok: false, error: `Password must be at least ${MIN_LEN[kind]} characters.` };
  const now = new Date().toISOString();
  // Atomic consume → a token can never be used twice, even under concurrent requests.
  const tok = unwrap(await db.collection(TOKENS).findOneAndUpdate(
    { kind, tokenHash: sha(token), usedAt: null, expiresAt: { $gt: now } }, { $set: { usedAt: now } },
  ));
  if (!tok || !tok.subjectId) return { ok: false, error: INVALID };
  const set = { passwordHash: await hashPassword(pw), updatedAt: now, passwordChangedAt: now };
  if (kind === 'platform') set.mustChangePassword = false;
  const acct = unwrap(await db.collection(COLLECTION[kind]).findOneAndUpdate({ id: tok.subjectId }, { $set: set }, { projection: { _id: 0, email: 1 } }));
  if (!acct) return { ok: false, error: INVALID };
  if (acct.email) await sendPasswordChangedNotice(db, acct.email);
  return { ok: true };
}
