// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ALL_THEME_IDS, isDarkTheme, THEME_GROUPS } from './theme-config';

describe('theme-config', () => {
  it('exposes every theme id from the groups in ALL_THEME_IDS', () => {
    const fromGroups = THEME_GROUPS.flatMap(g => g.themes.map(t => t.id));

    expect(ALL_THEME_IDS).toEqual(fromGroups);
  });

  it('keeps the next-themes-compatible default ids (light / dark)', () => {
    expect(ALL_THEME_IDS).toContain('light');
    expect(ALL_THEME_IDS).toContain('dark');
  });

  it('has no duplicate theme ids', () => {
    expect(new Set(ALL_THEME_IDS).size).toBe(ALL_THEME_IDS.length);
  });

  it('ships neutral default groups only (no product-specific names)', () => {
    const names = THEME_GROUPS.map(g => g.group);

    expect(names).toEqual(['Default', 'Modern SaaS', 'Warm Sand', 'Sage Green']);
  });

  describe('isDarkTheme', () => {
    it('flags the built-in dark theme', () => {
      expect(isDarkTheme('dark')).toBe(true);
      expect(isDarkTheme('light')).toBe(false);
    });

    it('flags every registry theme by its `isDark` metadata', () => {
      for (const group of THEME_GROUPS) {
        for (const theme of group.themes) {
          expect(isDarkTheme(theme.id)).toBe(theme.isDark);
        }
      }
    });
  });

  it('defines a CSS block in global.css for every non-default theme id', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/styles/global.css'),
      'utf8',
    );

    for (const id of ALL_THEME_IDS) {
      // `light` / `dark` live in :root / .dark, not a `.<id>` class.
      if (id === 'light' || id === 'dark') {
        continue;
      }

      expect(css).toContain(`.${id} {`);
    }
  });
});
