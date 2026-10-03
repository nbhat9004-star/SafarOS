// SafarOS — Auth primitives (ADAPT: JWT + bcrypt, now org/agency-aware).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'safaros_session';
export const PORTAL_COOKIE = 'safaros_portal';
export const PLATFORM_COOKIE = 'safaros_platform';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured');
  return s;
}

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

// payload = { userId, agencyId, role }
export function signSession(payload) {
  return jwt.sign(payload, secret(), { expiresIn: EXPIRES_IN });
}

export function verifySession(token) {
  try {
    const decoded = jwt.verify(token, secret());
    // A customer-portal OR platform-admin token must never be accepted as a staff session.
    if (decoded && (decoded.kind === 'portal' || decoded.kind === 'platform')) return null;
    return decoded;
  } catch {
    return null;
  }
}

// --- Customer Portal sessions (separate cookie + kind; isolated from staff auth) ---
export function signPortalSession(payload) {
  return jwt.sign({ ...payload, kind: 'portal' }, secret(), { expiresIn: EXPIRES_IN });
}

export function verifyPortalSession(token) {
  try {
    const decoded = jwt.verify(token, secret());
    if (!decoded || decoded.kind !== 'portal') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getPortalSession(request) {
  const token = request.cookies.get(PORTAL_COOKIE)?.value;
  if (!token) return null;
  return verifyPortalSession(token);
}

// Read + verify the session from a Next.js request. Returns payload or null.
export function getSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// --- Platform Super Admin sessions (separate cookie + kind; isolated from staff & portal auth) ---
export function signPlatformSession(payload) {
  return jwt.sign({ ...payload, kind: 'platform' }, secret(), { expiresIn: EXPIRES_IN });
}

export function verifyPlatformSession(token) {
  try {
    const decoded = jwt.verify(token, secret());
    if (!decoded || decoded.kind !== 'platform') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getPlatformSession(request) {
  const token = request.cookies.get(PLATFORM_COOKIE)?.value;
  if (!token) return null;
  return verifyPlatformSession(token);
}
