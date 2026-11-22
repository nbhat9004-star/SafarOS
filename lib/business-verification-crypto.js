// SafarOS — tenant-bound encryption for agency business verification documents.
// Requires the existing dedicated CREDENTIALS_ENCRYPTION_KEY (32+ characters).
// Ciphertext is authenticated with agency ID as AAD to prevent cross-tenant swaps.
import crypto from 'crypto';

const VERSION = 'v1';

function key() {
  const secret = String(process.env.CREDENTIALS_ENCRYPTION_KEY || '');
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY must contain at least 32 characters');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function aad(agencyId) {
  const id = String(agencyId || '').trim();
  if (!id) throw new Error('Agency context is required to protect business verification documents');
  return Buffer.from(`safaros:business-verification:${id}:${VERSION}`, 'utf8');
}

export function encryptBusinessVerificationDocument(base64Content, agencyId) {
  const plaintext = String(base64Content || '');
  if (!plaintext) throw new Error('Business verification document content is required');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(aad(agencyId));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [VERSION, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptBusinessVerificationDocument(blob, agencyId) {
  const parts = String(blob || '').split('.');
  if (parts.length !== 4 || parts[0] !== VERSION || !parts[1] || !parts[2] || !parts[3]) {
    throw new Error('Unsupported or malformed business verification document');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(parts[1], 'base64url'));
  decipher.setAAD(aad(agencyId));
  decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[3], 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
