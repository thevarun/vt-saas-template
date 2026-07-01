import type { PlatformConnectionSafe, PlatformConnectionStatus } from './types';

// A connection is "expiring soon" once it's within this many days of its token
// expiry. Tune per provider; keep it aligned with any reconnect-nudge cadence so
// the in-app signal and the email agree.
export const EXPIRING_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ConnectionHealth = {
  status: PlatformConnectionStatus;
  expiresAt: Date | null;
  daysRemaining: number | null;
};

/**
 * Single source of truth for a platform connection's health. Pure (no React, no
 * fetch) so it's unit-testable and usable from both client hooks and server code.
 * `now` is injectable for deterministic tests.
 *
 * - no connection            → `disconnected`
 * - connected, no expiry set  → `connected` (we only flag expiry when a timestamp
 *                               exists)
 * - expired (<= now)          → `expired`
 * - expires within the window → `expiring_soon`
 * - otherwise                 → `connected`
 */
export function getConnectionHealth(
  connection: PlatformConnectionSafe | undefined,
  now: Date = new Date(),
): ConnectionHealth {
  if (!connection) {
    return { status: 'disconnected', expiresAt: null, daysRemaining: null };
  }
  if (!connection.tokenExpiresAt) {
    return { status: 'connected', expiresAt: null, daysRemaining: null };
  }

  const expiresAt = new Date(connection.tokenExpiresAt);
  const msRemaining = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / DAY_MS);

  if (msRemaining <= 0) {
    return { status: 'expired', expiresAt, daysRemaining };
  }
  if (daysRemaining <= EXPIRING_SOON_DAYS) {
    return { status: 'expiring_soon', expiresAt, daysRemaining };
  }
  return { status: 'connected', expiresAt, daysRemaining };
}

/**
 * Whether a post can be published/scheduled to a connection in this state.
 * `expiring_soon` is still usable — the token is valid, just nearing expiry.
 * The single predicate for action gates (Post Now, Schedule).
 */
export function canPublish(status: PlatformConnectionStatus): boolean {
  return status === 'connected' || status === 'expiring_soon';
}
