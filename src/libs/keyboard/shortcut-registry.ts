/**
 * Keyboard shortcut registry.
 *
 * A minimal, product-neutral set of example shortcuts. Products extend this with
 * their own routes and actions by appending `ShortcutDefinition`s:
 *   - `combo`    — modifier chord, e.g. ⌘K (`{ type: 'combo', meta: true, key: 'k' }`).
 *   - `single`   — one key, e.g. `/` (`{ type: 'single', key: '/' }`).
 *   - `sequence` — two keys in order, e.g. "G then D".
 *
 * Scope a shortcut to specific routes via `activePaths` (omit for all pages).
 * Wire the handlers in the app shell via `useKeyboardShortcuts` (always-on
 * handlers) or the keyboard store's `registerAction` (page-specific handlers).
 */

type ShortcutCategory = 'navigation' | 'actions';

type KeyPattern
  = | { type: 'combo'; meta?: boolean; shift?: boolean; key: string }
    | { type: 'single'; key: string }
    | { type: 'sequence'; first: string; second: string };

type ShortcutDefinition = {
  id: string;
  /** Display string shown in the command palette (e.g. "⌘ K", "G then D") */
  keys: string;
  keyPattern: KeyPattern;
  label: string;
  category: ShortcutCategory;
  /** Route prefixes where this shortcut is active. undefined = all pages. */
  activePaths?: string[];
  /** If true, fires even when user is in an input/textarea/contenteditable */
  worksInEditable?: boolean;
};

// --- Global shortcuts ---

const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'command-palette',
    keys: '⌘ K',
    keyPattern: { type: 'combo', meta: true, key: 'k' },
    label: 'Open command palette',
    category: 'actions',
    worksInEditable: true,
  },
  {
    id: 'toggle-sidebar',
    keys: '⌘ B',
    keyPattern: { type: 'combo', meta: true, key: 'b' },
    label: 'Toggle sidebar',
    category: 'actions',
  },
];

// --- Navigation shortcuts ---

const NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'go-dashboard',
    keys: 'G then D',
    keyPattern: { type: 'sequence', first: 'g', second: 'd' },
    label: 'Go to Dashboard',
    category: 'navigation',
  },
];

// --- Context-sensitive action shortcuts ---

/**
 * Shortcut id for replaying the product tour. `useTour` registers its handler
 * under this id via the keyboard store, so the registry and the tour must agree
 * on the value — keep them in sync through this constant.
 */
export const REPLAY_TOUR_SHORTCUT_ID = 'replay-tour';

const ACTION_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'focus-input',
    keys: '/',
    keyPattern: { type: 'single', key: '/' },
    label: 'Focus input',
    category: 'actions',
  },
  {
    id: REPLAY_TOUR_SHORTCUT_ID,
    keys: 'T then R',
    keyPattern: { type: 'sequence', first: 't', second: 'r' },
    label: 'Replay tour',
    category: 'actions',
  },
];

/** All actionable shortcuts (used by the keyboard hook) */
export const SHORTCUTS = [
  ...GLOBAL_SHORTCUTS,
  ...NAVIGATION_SHORTCUTS,
  ...ACTION_SHORTCUTS,
];

/** All shortcuts including any display-only entries (used by the command palette) */
export const ALL_SHORTCUTS = [
  ...SHORTCUTS,
];

export type { KeyPattern, ShortcutCategory, ShortcutDefinition };
