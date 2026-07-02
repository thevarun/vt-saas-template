/**
 * Site Config — single source of truth for brand + legal placeholders.
 *
 * Forks: edit ONLY this file to rebrand. Scattered constants
 * (`src/utils/AppConfig.ts`, `src/libs/seo/constants.ts`) derive their brand
 * values from here, so the product name lives in exactly one place.
 *
 * Values below are NEUTRAL placeholders that preserve the template's default
 * branding — replace them with your product's real details after forking.
 */

import type { ThemeId } from '@/components/theme/theme-config';

export type SiteConfig = {
  brand: {
    name: string;
    tagline: string;
    logo: {
      nav: string;
      og: string;
    };
    /** Social handles/URLs keyed by platform, e.g. `{ x: 'https://x.com/...' }`. */
    social: Record<string, string>;
    supportEmail: string;
  };
  /**
   * Theme applied to the public marketing surface (`/`, `/about`, `/blog`,
   * `/changelog`, `/terms`, `/privacy`). Scoped to the marketing shell only —
   * it is INDEPENDENT of the in-app user theme (no visitor toggle), so the
   * landing site can carry its own brand look while the signed-in app keeps
   * the user's chosen theme. Any `ThemeId` from the theme registry works.
   * Default `light` preserves the template's out-of-the-box marketing look.
   */
  marketingTheme: ThemeId;
  /** Placeholders for the future /terms + /privacy scaffold. */
  legal: {
    companyLegalName: string;
    governingLaw: string;
    effectiveDate: string;
    supportEmail: string;
  };
};

const brand = {
  name: 'VT SaaS Template',
  tagline: 'Build your SaaS faster',
  logo: {
    nav: '/logo.png',
    og: '/logo-og.png',
  },
  social: {},
  supportEmail: 'hello@example.com',
} as const satisfies SiteConfig['brand'];

export const SITE_CONFIG = {
  brand,
  marketingTheme: 'light',
  legal: {
    companyLegalName: 'Your Company, Inc.',
    governingLaw: 'State of Delaware, USA',
    effectiveDate: '2025-01-01',
    supportEmail: brand.supportEmail,
  },
} as const satisfies SiteConfig;
