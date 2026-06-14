import { describe, expect, it } from 'vitest';

import { ALL_SHORTCUTS, SHORTCUTS } from './shortcut-registry';

const VALID_KEY_PATTERN_TYPES = new Set(['combo', 'single', 'sequence']);
const VALID_CATEGORIES = new Set(['navigation', 'actions']);

describe('shortcut-registry', () => {
  it('SHORTCUTS is a non-empty array of well-formed definitions', () => {
    expect(Array.isArray(SHORTCUTS)).toBe(true);
    expect(SHORTCUTS.length).toBeGreaterThan(0);

    for (const s of SHORTCUTS) {
      expect(typeof s.id).toBe('string');
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.keys).toBe('string');
      expect(typeof s.label).toBe('string');
      expect(VALID_CATEGORIES.has(s.category)).toBe(true);
    }
  });

  it('every shortcut has a valid keyPattern discriminant', () => {
    for (const s of SHORTCUTS) {
      expect(VALID_KEY_PATTERN_TYPES.has(s.keyPattern.type)).toBe(true);

      if (s.keyPattern.type === 'combo' || s.keyPattern.type === 'single') {
        expect(typeof s.keyPattern.key).toBe('string');
        expect(s.keyPattern.key.length).toBeGreaterThan(0);
      } else {
        expect(typeof s.keyPattern.first).toBe('string');
        expect(typeof s.keyPattern.second).toBe('string');
      }
    }
  });

  it('shortcut ids are unique', () => {
    const ids = SHORTCUTS.map(s => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ALL_SHORTCUTS is a superset of SHORTCUTS', () => {
    const allIds = new Set(ALL_SHORTCUTS.map(s => s.id));

    for (const s of SHORTCUTS) {
      expect(allIds.has(s.id)).toBe(true);
    }
  });
});
