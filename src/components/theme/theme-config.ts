/**
 * Multi-theme registry (template issue #250).
 *
 * Type-safe source of truth for the themes the app ships. Each theme id maps to
 * a CSS class in `src/styles/global.css` (except the default `light` / `dark`,
 * which live in `:root` / `.dark`). Keep the two files in sync.
 *
 * The `light`/`dark` ids are the defaults `next-themes` already uses, so the
 * existing light/dark toggle keeps working unchanged.
 */

export type ThemeId
  = | 'light'
    | 'dark'
    | 'modern-light'
    | 'modern-dark'
    | 'warm-light'
    | 'warm-dark'
    | 'sage-light'
    | 'sage-dark';

export type Theme = {
  id: ThemeId;
  label: string;
  isDark: boolean;
};

export type ThemeGroup = {
  /** Display name for the group (e.g. shown as a dropdown section label). */
  group: string;
  /** Representative color for the group swatch (any CSS color: HSL or OKLCH). */
  swatch: string;
  /** The light/dark variants that belong to this group. */
  themes: Theme[];
};

export const THEME_GROUPS: ThemeGroup[] = [
  {
    group: 'Default',
    swatch: 'hsl(222.2 47.4% 11.2%)',
    themes: [
      { id: 'light', label: 'Light', isDark: false },
      { id: 'dark', label: 'Dark', isDark: true },
    ],
  },
  {
    group: 'Modern SaaS',
    swatch: 'hsl(217.2 91.2% 59.8%)',
    themes: [
      { id: 'modern-light', label: 'Light', isDark: false },
      { id: 'modern-dark', label: 'Dark', isDark: true },
    ],
  },
  {
    group: 'Warm Sand',
    swatch: 'oklch(0.55 0.155 39.0427)',
    themes: [
      { id: 'warm-light', label: 'Light', isDark: false },
      { id: 'warm-dark', label: 'Dark', isDark: true },
    ],
  },
  {
    group: 'Sage Green',
    swatch: 'oklch(0.5486 0.0866 132.737)',
    themes: [
      { id: 'sage-light', label: 'Light', isDark: false },
      { id: 'sage-dark', label: 'Dark', isDark: true },
    ],
  },
];

/** Every registered theme id, in the shape next-themes' `themes` prop expects. */
export const ALL_THEME_IDS = THEME_GROUPS.flatMap(g => g.themes.map(t => t.id));

/** True when a theme id is a dark variant (drives the `.dark` class sync). */
export function isDarkTheme(themeId: string): boolean {
  return themeId === 'dark' || themeId.endsWith('-dark');
}
