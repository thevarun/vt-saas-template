// @vitest-environment node
import { Buffer } from 'node:buffer';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A valid 32-byte (64 hex char) key — `openssl rand -hex 32` shape.
const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

vi.mock('@/libs/Env', () => ({
  Env: {
    TOKEN_ENCRYPTION_KEY: undefined as string | undefined,
  },
}));

type MockEnv = { TOKEN_ENCRYPTION_KEY: string | undefined };

async function loadWithKey(key: string | undefined) {
  vi.resetModules();
  const { Env } = await import('@/libs/Env');
  (Env as unknown as MockEnv).TOKEN_ENCRYPTION_KEY = key;
  return import('./token-encryption');
}

describe('token-encryption (AES-256-GCM)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips: decrypt(encrypt(x)) === x', async () => {
    const { encryptToken, decryptToken } = await loadWithKey(TEST_KEY);

    const secret = 'ya29.super-secret-oauth-access-token';

    expect(decryptToken(encryptToken(secret))).toBe(secret);
  });

  it('produces distinct ciphertext per call (random IV)', async () => {
    const { encryptToken, decryptToken } = await loadWithKey(TEST_KEY);

    const a = encryptToken('same-input');
    const b = encryptToken('same-input');

    expect(a).not.toBe(b);
    // …yet both decrypt back to the original.
    expect(decryptToken(a)).toBe('same-input');
    expect(decryptToken(b)).toBe('same-input');
  });

  it('detects tampering via the GCM auth tag', async () => {
    const { encryptToken, decryptToken } = await loadWithKey(TEST_KEY);

    const [iv, tag, data] = encryptToken('tamper-me').split(':');

    // Flip a byte in the ciphertext segment — auth-tag verification must fail.
    const dataBytes = Buffer.from(data!, 'base64');
    dataBytes[0] = dataBytes[0]! ^ 0xFF;
    const tampered = [iv, tag, dataBytes.toString('base64')].join(':');

    expect(() => decryptToken(tampered)).toThrow();
  });

  it('throws "Invalid encrypted token format" for a malformed envelope', async () => {
    const { decryptToken } = await loadWithKey(TEST_KEY);

    expect(() => decryptToken('not-a-valid-envelope')).toThrow('Invalid encrypted token format');
  });

  it('throws when TOKEN_ENCRYPTION_KEY is not configured', async () => {
    const { encryptToken, decryptToken } = await loadWithKey(undefined);

    expect(() => encryptToken('x')).toThrow('TOKEN_ENCRYPTION_KEY is not configured');
    expect(() => decryptToken('a:b:c')).toThrow('TOKEN_ENCRYPTION_KEY is not configured');
  });
});
