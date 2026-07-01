'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useKeyboardShortcutStore } from '@/stores/keyboard-shortcut-store';

import { SHORTCUTS } from './shortcut-registry';

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(\/|$)/;
const SEQUENCE_TIMEOUT_MS = 1500;

function isInEditableField(): boolean {
  const el = document.activeElement;
  if (!el) {
    return false;
  }
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    return true;
  }
  if (el.getAttribute('contenteditable') === 'true') {
    return true;
  }
  if (el.closest('[contenteditable="true"]')) {
    return true;
  }
  return false;
}

function hasModifiers(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
}

/**
 * Global keyboard shortcuts hook. Call once in the app shell.
 *
 * @param staticHandlers — handlers for shortcuts that are always available
 *   (navigation, sidebar toggle, palette). Page-specific handlers are
 *   registered via the Zustand store's registerAction/unregisterAction.
 */
export function useKeyboardShortcuts(
  staticHandlers: Record<string, () => void>,
) {
  const pathname = usePathname();
  const pendingKeyRef = useRef<{ key: string; timestamp: number } | null>(null);
  const staticHandlersRef = useRef(staticHandlers);
  staticHandlersRef.current = staticHandlers;

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const { isCommandPaletteOpen, actionHandlers }
        = useKeyboardShortcutStore.getState();

      // When command palette is open, let it handle all keys
      if (isCommandPaletteOpen) {
        return;
      }

      const cleanPath = pathname.replace(LOCALE_PREFIX_RE, '/');

      // --- Check sequence continuations first ---
      if (pendingKeyRef.current) {
        const elapsed = Date.now() - pendingKeyRef.current.timestamp;
        const firstKey = pendingKeyRef.current.key;
        pendingKeyRef.current = null;

        if (elapsed < SEQUENCE_TIMEOUT_MS && !hasModifiers(e)) {
          const secondKey = e.key.toLowerCase();
          const match = SHORTCUTS.find(
            s =>
              s.keyPattern.type === 'sequence'
              && s.keyPattern.first === firstKey
              && s.keyPattern.second === secondKey,
          );
          if (match && isShortcutActiveOnPath(match.activePaths, cleanPath)) {
            e.preventDefault();
            executeAction(match.id, staticHandlersRef.current, actionHandlers);
            return;
          }
        }
        // Fell through — pending key expired or no match, continue to check other shortcuts
      }

      // --- Modifier combos (⌘K, ⌘B, ⌘⇧A) ---
      if (e.metaKey || e.ctrlKey) {
        for (const shortcut of SHORTCUTS) {
          if (shortcut.keyPattern.type !== 'combo') {
            continue;
          }
          if (!shortcut.keyPattern.meta) {
            continue;
          }

          const keyMatch = e.key.toLowerCase() === shortcut.keyPattern.key;
          const shiftMatch = shortcut.keyPattern.shift
            ? e.shiftKey
            : !e.shiftKey;

          if (keyMatch && shiftMatch) {
            // Skip non-editable-safe combos when in editable field
            if (!shortcut.worksInEditable && isInEditableField()) {
              continue;
            }
            if (!isShortcutActiveOnPath(shortcut.activePaths, cleanPath)) {
              continue;
            }

            e.preventDefault();
            executeAction(
              shortcut.id,
              staticHandlersRef.current,
              actionHandlers,
            );
            return;
          }
        }
        return;
      }

      // --- Single-key and sequence-start shortcuts ---
      // All of these are skipped when in editable fields
      if (isInEditableField()) {
        return;
      }
      if (hasModifiers(e)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check for sequence starters (e.g. 'g')
      const isSequenceStart = SHORTCUTS.some(
        s => s.keyPattern.type === 'sequence' && s.keyPattern.first === key,
      );
      if (isSequenceStart) {
        pendingKeyRef.current = { key, timestamp: Date.now() };
        return;
      }

      // Check single-key shortcuts (handle '?' which requires checking e.key directly)
      const pressedKey = e.key === '?' ? '?' : key;
      for (const shortcut of SHORTCUTS) {
        if (shortcut.keyPattern.type !== 'single') {
          continue;
        }
        if (shortcut.keyPattern.key !== pressedKey) {
          continue;
        }
        if (!isShortcutActiveOnPath(shortcut.activePaths, cleanPath)) {
          continue;
        }

        e.preventDefault();
        executeAction(shortcut.id, staticHandlersRef.current, actionHandlers);
        return;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [pathname]);
}

export function isShortcutActiveOnPath(
  activePaths: string[] | undefined,
  cleanPath: string,
): boolean {
  if (!activePaths) {
    return true;
  }
  return activePaths.some((p) => {
    // A trailing slash marks "sub-paths only" — e.g. '/posts/' matches the
    // detail page '/posts/123' but not the '/posts' list.
    if (p.endsWith('/')) {
      return cleanPath.startsWith(p);
    }
    // Exact match or a true sub-path. The `${p}/` boundary prevents a bare
    // `startsWith(p)` from letting '/dashboard' match '/dashboards'.
    return cleanPath === p || cleanPath.startsWith(`${p}/`);
  });
}

function executeAction(
  id: string,
  staticHandlers: Record<string, () => void>,
  actionHandlers: Map<string, () => void>,
) {
  const handler = staticHandlers[id] ?? actionHandlers.get(id);
  handler?.();
}
