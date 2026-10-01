// Auth helpers: password hashing (bcryptjs), JWT sign/verify, cookies, role guards.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const COOKIE_NAME = 'safar_token';
export const ROLES = ['admin', 'super_admin', 'host', 'traveler'];

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export function setAuthCookie(res, token) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAuthCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}

export function getTokenFromRequest(request) {
  const c = request.cookies?.get?.(COOKIE_NAME)?.value;
  if (c) return c;
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function getCurrentUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.uid) return null;
  const users = await getCollection('users');
  const u = await users.findOne({ id: payload.uid }, { projection: { passwordHash: 0 } });
  return u || null;
}

export function publicUser(u) {
  if (!u) return null;
  const { passwordHash, _id, ...rest } = u;
  return rest;
}

export function requireRole(user, roles) {
  if (!user) return { ok: false, status: 401, error: 'Authentication required' };
  const allowed = Array.isArray(roles) ? roles : [roles];
  
  // Normalize role to lowercase for case-insensitive comparison
  const userRole = user.role?.toLowerCase();
  
  // Super admin has access to all admin routes
  if (userRole === 'super_admin' && allowed.some(r => r.toLowerCase() === 'admin')) {
    return { ok: true };
  }
  
  // Check if user's role is in the allowed list (case-insensitive)
  const isAllowed = allowed.some(r => r.toLowerCase() === userRole);
  if (!isAllowed) return { ok: false, status: 403, error: 'Forbidden: insufficient role' };
  return { ok: true };
}

// Helper: build JSON response with optional cookie
export function jsonResponse(data, init = {}) {
  return NextResponse.json(data, init);
}
