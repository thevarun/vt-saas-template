/**
 * Marketing shell nav config (opt-in).
 *
 * Neutral default link sets for the brand-config-driven marketing Navbar +
 * Footer. Each entry stores a next-intl message KEY (not a literal label) in the
 * shared `MarketingChrome` namespace; the shell components resolve it via
 * `t(entry.labelKey)` so the chrome localises with the rest of the app. `href`s
 * stay plain so a fork can rewire routes without touching translations.
 */

/** Keys of the shared `MarketingChrome` message namespace (type-safe labels). */
type ChromeMessageKey = keyof IntlMessages['MarketingChrome'];

export type NavLink = {
  labelKey: ChromeMessageKey;
  href: string;
};

export type NavResource = NavLink & {
  descriptionKey: ChromeMessageKey;
};

/** Primary links shown before the Resources dropdown. */
export const leadingNavLinks: NavLink[] = [
  { labelKey: 'features', href: '/#features' },
];

/** Primary links shown after the Resources dropdown. */
export const trailingNavLinks: NavLink[] = [
  { labelKey: 'pricing', href: '/#pricing' },
];

/** Grouped links surfaced in the Resources dropdown. */
export const resourcesLinks: NavResource[] = [
  { labelKey: 'blog', href: '/blog', descriptionKey: 'blog_description' },
  { labelKey: 'about', href: '/about', descriptionKey: 'about_description' },
  { labelKey: 'changelog', href: '/changelog', descriptionKey: 'changelog_description' },
];

/** Flat list used by the mobile menu (no dropdowns). */
export const flatNavLinks: NavLink[] = [...leadingNavLinks, ...trailingNavLinks];
