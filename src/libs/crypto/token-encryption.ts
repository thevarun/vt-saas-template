/**
 * Token Encryption (AES-256-GCM)
 *
 * Symmetric encryption for sensitive secrets at rest — e.g. OAuth access /
 * refresh tokens stored in the database. Provider-neutral: any integration that
 * needs to persist a bearer token can encrypt it here.
 *
 * Envelope format: `iv:tag:encrypted`, where each segment is base64-encoded.
 * - `iv`  — 12-byte random initialization vector (NIST-recommended for GCM),
 *           fresh per call so identical plaintext yields distinct ciphertext.
 * - `tag` — GCM authentication tag; verified on decrypt to detect tampering.
 * - `encrypted` — the ciphertext bytes.
 *
 * Requires `TOKEN_ENCRYPTION_KEY`: a 32-byte (64 hex chars) key. Generate with
 * `openssl rand -hex 32`. Both functions throw if it is not configured.
 */

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

import { Env } from '@/libs/Env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes — NIST recommended for AES-GCM

export function encryptToken(token: string): string {
  const encryptionKey = Env.TOKEN_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(encryptionKey, 'hex'); // 32 bytes
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as iv:tag:encrypted (all base64) — self-contained, IV is random per encryption
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

export function decryptToken(encryptedToken: string): string {
  const encryptionKey = Env.TOKEN_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }
  const key = Buffer.from(encryptionKey, 'hex');
  const [ivB64, tagB64, dataB64] = encryptedToken.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}
