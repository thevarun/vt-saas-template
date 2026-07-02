'use client';

import { useEffect } from 'react';

/**
 * Mirrors the marketing theme class(es) onto `document.body` so Radix portals —
 * the auth Dialog, dropdown/select menus — which mount to `body` OUTSIDE the
 * marketing shell wrapper, inherit the marketing palette instead of the app's
 * `<html>` theme. Without this, a fork with a dark `marketingTheme` would open a
 * light auth modal over its dark landing page.
 *
 * This mirrors the admin panel's body-scope pattern (see `AdminLayoutClient` +
 * the `[data-admin]` blocks in `global.css`). The main marketing UI is themed by
 * the SSR'd wrapper class (no FOUC); portalled overlays are user-triggered after
 * hydration, so a client-only effect is sufficient. The effect removes the
 * classes on unmount so the scope never leaks onto non-marketing routes.
 */
export function MarketingThemeScope({ themeClass }: { themeClass: string }) {
  useEffect(() => {
    const classes = themeClass.split(' ').filter(Boolean);
    if (classes.length === 0) {
      return;
    }
    const { body } = document;
    // Only remove classes this effect actually added, so we don't strip a class
    // the body already carried (defensive against overlap with other scopes).
    const added = classes.filter(c => !body.classList.contains(c));
    body.classList.add(...added);
    return () => body.classList.remove(...added);
  }, [themeClass]);

  return null;
}
