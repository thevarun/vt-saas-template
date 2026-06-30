export type Period = {
  start: Date;
  end: Date;
};

/**
 * Length of the rolling quota window. Default is 7 days; a fork can change the
 * cadence (e.g. 30 days for a monthly meter) in one place.
 */
export const PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the current rolling quota period for a user, anchored at `anchorAt`
 * (the user's `current_period_anchor_at`, or `started_at` as a fallback).
 *
 * The anchor is reset on every tier transition (free→trial, trial→pro,
 * promotion→free, etc.) so a user's first window after upgrading begins at the
 * moment of upgrade — not at original signup.
 */
export function getCurrentPeriod(anchorAt: Date, now: Date = new Date()): Period {
  const elapsedMs = now.getTime() - anchorAt.getTime();
  const periodsSinceAnchor = Math.max(0, Math.floor(elapsedMs / PERIOD_MS));
  const start = new Date(anchorAt.getTime() + periodsSinceAnchor * PERIOD_MS);
  const end = new Date(start.getTime() + PERIOD_MS);
  return { start, end };
}

/**
 * Formats a Date as a YYYY-MM-DD string in UTC.
 * Used for SQL DATE comparisons and storage.
 */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
