import { describe, expect, it } from 'vitest';

import { canPublish, EXPIRING_SOON_DAYS, getConnectionHealth } from './connection-health';
import type { PlatformConnectionSafe } from './types';

const NOW = new Date('2026-06-23T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function conn(tokenExpiresAt: string | null): PlatformConnectionSafe {
  return {
    id: 'c1',
    userId: 'u1',
    provider: 'my-provider',
    tokenExpiresAt,
    providerAccountId: 'acct-sub',
    username: 'jane',
    displayName: 'Jane Doe',
    profilePictureUrl: null,
    status: 'connected',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

function isoIn(ms: number): string {
  return new Date(NOW.getTime() + ms).toISOString();
}

describe('getConnectionHealth', () => {
  it('no connection → disconnected', () => {
    expect(getConnectionHealth(undefined, NOW)).toEqual({
      status: 'disconnected',
      expiresAt: null,
      daysRemaining: null,
    });
  });

  it('connection with null expiry → connected', () => {
    const health = getConnectionHealth(conn(null), NOW);

    expect(health.status).toBe('connected');
    expect(health.expiresAt).toBeNull();
    expect(health.daysRemaining).toBeNull();
  });

  it('expiry far out (+30d) → connected', () => {
    expect(getConnectionHealth(conn(isoIn(30 * DAY_MS)), NOW).status).toBe('connected');
  });

  it('expiry just outside the window (+8d) → connected', () => {
    expect(getConnectionHealth(conn(isoIn(8 * DAY_MS)), NOW).status).toBe('connected');
  });

  it('expiry at the window edge (+7d) → expiring_soon', () => {
    const health = getConnectionHealth(conn(isoIn(EXPIRING_SOON_DAYS * DAY_MS)), NOW);

    expect(health.status).toBe('expiring_soon');
    expect(health.daysRemaining).toBe(7);
  });

  it('expiry tomorrow (+1d) → expiring_soon', () => {
    expect(getConnectionHealth(conn(isoIn(1 * DAY_MS)), NOW).status).toBe('expiring_soon');
  });

  it('just expired (−1ms) → expired', () => {
    expect(getConnectionHealth(conn(isoIn(-1)), NOW).status).toBe('expired');
  });

  it('long expired (−5d) → expired', () => {
    const health = getConnectionHealth(conn(isoIn(-5 * DAY_MS)), NOW);

    expect(health.status).toBe('expired');
    expect(health.expiresAt).toBeInstanceOf(Date);
  });
});

describe('canPublish', () => {
  it('true for connected and expiring_soon', () => {
    expect(canPublish('connected')).toBe(true);
    expect(canPublish('expiring_soon')).toBe(true);
  });

  it('false for expired and disconnected', () => {
    expect(canPublish('expired')).toBe(false);
    expect(canPublish('disconnected')).toBe(false);
  });
});
