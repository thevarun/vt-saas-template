/**
 * Single source of truth for TanStack Query keys.
 *
 * Why this exists: hand-typed key literals (`['items']`, `['item', id]`, …)
 * duplicated across hooks and every component that invalidates them. A typo
 * silently produced stale data instead of an error. Importing from here makes
 * keys typo-proof (a wrong key is a `tsc` error), greppable, and the whole
 * namespace reviewable in one file.
 *
 * Keep this module server-safe (NO `'use client'`) so RSC prefetch on a page
 * can import the same keys it later hydrates the client with — see the
 * server-safe fetch-function pattern in `src/libs/queries/item.ts`.
 *
 * `items` is a generic placeholder entity. A fork copies the namespace and
 * renames `items` → its own entity (`posts`, `projects`, …); list-style keys
 * stay `as const` arrays, parameterized keys stay functions so a bare prefix
 * (`queryKeys.items.all`) invalidates every variant.
 */
export const queryKeys = {
  items: {
    /** List view. See `useItems`. */
    all: ['items'] as const,
    /** Single record. See `useItem`. */
    detail: (id: string) => ['item', id] as const,
  },
  subscription: {
    /** Current user's subscription + tier + quota + usage. See `useSubscriptionUsage`. */
    usage: ['subscription', 'usage'] as const,
  },
} as const;
