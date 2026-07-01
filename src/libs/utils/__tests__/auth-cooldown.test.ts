// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COOLDOWN_DURATION,
  getCooldownExpiry,
  getCooldownKey,
  getRemainingCooldown,
  setCooldownExpiry,
} from '../auth-cooldown';

const PREFIX = 'email_resend_cooldown';
const EMAIL = 'user@example.com';

describe('auth-cooldown', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a prefix-scoped storage key', () => {
    expect(getCooldownKey(PREFIX, EMAIL)).toBe(`${PREFIX}_${EMAIL}`);
  });

  it('returns null expiry when nothing is stored', () => {
    expect(getCooldownExpiry(PREFIX, EMAIL)).toBeNull();
  });

  it('persists and reads back the expiry timestamp', () => {
    const expiry = Date.now() + COOLDOWN_DURATION * 1000;
    setCooldownExpiry(PREFIX, EMAIL, expiry);

    expect(getCooldownExpiry(PREFIX, EMAIL)).toBe(expiry);
  });

  it('reports remaining seconds until expiry', () => {
    setCooldownExpiry(PREFIX, EMAIL, Date.now() + COOLDOWN_DURATION * 1000);

    expect(getRemainingCooldown(PREFIX, EMAIL)).toBe(COOLDOWN_DURATION);
  });

  it('returns 0 once the cooldown has elapsed', () => {
    setCooldownExpiry(PREFIX, EMAIL, Date.now() + 5000);
    vi.advanceTimersByTime(6000);

    expect(getRemainingCooldown(PREFIX, EMAIL)).toBe(0);
  });

  it('isolates cooldowns across different prefixes', () => {
    setCooldownExpiry(PREFIX, EMAIL, Date.now() + COOLDOWN_DURATION * 1000);

    expect(getRemainingCooldown('password_reset_cooldown', EMAIL)).toBe(0);
  });
});
