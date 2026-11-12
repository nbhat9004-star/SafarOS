// SafarOS — per-agency WhatsApp credential encryption.
// This is intentionally separate from platform-level lib/secrets.js.
// Requires a dedicated 32+ character CREDENTIALS_ENCRYPTION_KEY in Vercel.
// Ciphertext is authenticated with the agency ID as AAD to prevent cross-tenant swapping.

import crypto from 'crypto';

const VERSION = 'v1';

function encryptionKey() {
  const secret = String(process.env.CREDENTIALS_ENCRYPTION_KEY || '');
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must contain at least 32 characters');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function aadFor(agencyId) {
  const id = String(agencyId || '').trim();
  if (!id) throw new Error('Agency context is required to protect WhatsApp credentials');
  return Buffer.from(`safaros:whatsapp:${id}:${VERSION}`, 'utf8');
}

export function encryptAgencyWhatsAppToken(token, agencyId) {
  const plaintext = String(token || '');
  if (!plaintext) throw new Error('WhatsApp access token is required');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  cipher.setAAD(aadFor(agencyId));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptAgencyWhatsAppToken(blob, agencyId) {
  const parts = String(blob || '').split('.');
  if (parts.length !== 4 || parts[0] !== VERSION || !parts[1] || !parts[2] || !parts[3]) {
    throw new Error('Unsupported or malformed WhatsApp credential');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(parts[1], 'base64url'));
  decipher.setAAD(aadFor(agencyId));
  decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
