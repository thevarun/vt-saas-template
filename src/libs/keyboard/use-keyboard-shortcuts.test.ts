import { describe, expect, it } from 'vitest';

import { isShortcutActiveOnPath } from './use-keyboard-shortcuts';

describe('isShortcutActiveOnPath', () => {
  it('activates everywhere when activePaths is undefined', () => {
    expect(isShortcutActiveOnPath(undefined, '/anything')).toBe(true);
  });

  it('matches exact path and true sub-paths without a trailing slash', () => {
    expect(isShortcutActiveOnPath(['/posts'], '/posts')).toBe(true);
    expect(isShortcutActiveOnPath(['/posts'], '/posts/123')).toBe(true);
  });

  it('does not false-match a sibling path with a shared prefix', () => {
    expect(isShortcutActiveOnPath(['/posts'], '/postsettings')).toBe(false);
  });

  it('scopes a trailing-slash path to sub-paths only', () => {
    // '/posts/' vs '/posts' boundary: the trailing slash excludes the list page.
    expect(isShortcutActiveOnPath(['/posts/'], '/posts/123')).toBe(true);
    expect(isShortcutActiveOnPath(['/posts/'], '/posts')).toBe(false);
  });
});
