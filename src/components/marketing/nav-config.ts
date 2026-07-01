/**
 * Marketing shell nav config (opt-in).
 *
 * Neutral default link sets for the brand-config-driven marketing Navbar +
 * Footer. Labels are English-only literals for now.
 *
 * TODO(i18n seam): these labels are deliberately plain strings so a fork can
 * swap them to next-intl later without touching the shell components. Point a
 * `messages`-backed lookup here (or thread labels via `site-config`) when the
 * marketing surface needs localisation.
 */

export type NavLink = {
  label: string;
  href: string;
};

export type NavResource = NavLink & {
  description: string;
};

/** Primary links shown before the Resources dropdown. */
export const leadingNavLinks: NavLink[] = [
  { label: 'Features', href: '/#features' },
];

/** Primary links shown after the Resources dropdown. */
export const trailingNavLinks: NavLink[] = [
  { label: 'Pricing', href: '/#pricing' },
];

/** Grouped links surfaced in the Resources dropdown. */
export const resourcesLinks: NavResource[] = [
  { label: 'Blog', href: '/blog', description: 'Guides, updates, and how-tos.' },
  { label: 'About', href: '/about', description: 'The story behind the product.' },
  { label: 'Changelog', href: '/changelog', description: 'Recent updates and improvements.' },
];

/** Flat list used by the mobile menu (no dropdowns). */
export const flatNavLinks: NavLink[] = [...leadingNavLinks, ...trailingNavLinks];
