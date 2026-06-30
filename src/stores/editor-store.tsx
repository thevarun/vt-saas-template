/* eslint-disable react-refresh/only-export-components -- store factory + context idiom intentionally colocates the provider component with its hooks in one module */
'use client';

import type { ReactNode } from 'react';
import { createContext, use, useState } from 'react';
import type { StoreApi } from 'zustand';
import { createStore, useStore } from 'zustand';

/**
 * Per-entity scoped store — Zustand factory + React context idiom.
 *
 * Each mounted editor gets its OWN store instance (via {@link EditorStoreProvider},
 * keyed on the entity id), so client-side navigation between entities can't leak
 * one entity's transient state (draft content, dirty flag, …) into the next. A
 * fresh store per entity eliminates that whole bug class by construction rather
 * than resetting fields one-by-one on every route change.
 *
 * Contrast with the module-level singletons (`editor-ui-store.ts`,
 * `entity-dialog-store.ts`): those are deliberately ONE store for the whole app
 * — use them for state that should survive navigation. Use THIS factory for
 * state that should be torn down per entity.
 *
 * A fork renames `entity` → its domain (`post`, `document`, `project`) and adds
 * the slices it needs; the factory/context machinery stays as-is.
 */

type EditorStore = {
  content: string;
  setContent: (content: string) => void;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

type EditorStoreInit = {
  initialContent?: string;
};

const createEditorStore = (init?: EditorStoreInit) =>
  createStore<EditorStore>()(set => ({
    content: init?.initialContent ?? '',
    setContent: content => set({ content }),
    isDirty: false,
    setDirty: isDirty => set({ isDirty }),
  }));

type EditorStoreApi = StoreApi<EditorStore>;

const EditorStoreContext = createContext<EditorStoreApi | null>(null);

/**
 * Creates one store per mount and provides it to the subtree. Place at the
 * editor route boundary with `key={entityId}` so navigating A → B remounts the
 * provider and hands the next entity a clean store.
 *
 * `useState(() => createEditorStore(...))` runs the factory exactly once for the
 * lifetime of this provider instance (not on every render). `initialContent` is
 * read only at creation; the provider remounts per `key`, so a new entity always
 * gets a fresh store seeded with its own content.
 */
export function EditorStoreProvider({
  children,
  initialContent,
}: {
  children: ReactNode;
  initialContent?: string;
}) {
  const [store] = useState(() => createEditorStore({ initialContent }));
  return (
    <EditorStoreContext value={store}>
      {children}
    </EditorStoreContext>
  );
}

/**
 * Subscribe to the per-entity editor store. Supports both call forms:
 *   - `useEditorStore()`            → whole state (re-renders on any change)
 *   - `useEditorStore(s => s.x)`    → selected slice
 *
 * Throws if used outside {@link EditorStoreProvider} — a missed provider
 * boundary fails loudly at first render rather than silently reading a stale
 * shared singleton (the bug this idiom exists to kill).
 */
export function useEditorStore(): EditorStore;
export function useEditorStore<T>(selector: (state: EditorStore) => T): T;
export function useEditorStore<T>(selector?: (state: EditorStore) => T) {
  const store = use(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStore must be used within an EditorStoreProvider');
  }
  // When no selector is passed the public overload fixes T = EditorStore, so
  // the identity fallback is sound; the cast just reconciles the union that the
  // optional-param implementation signature produces.
  return useStore(store, (selector ?? ((state: EditorStore) => state)) as (state: EditorStore) => T);
}

/**
 * Returns the store's `StoreApi` for imperative `getState`/`setState`/`subscribe`
 * outside the render path (event handlers, save callbacks). Throws outside the
 * provider for the same reason as `useEditorStore`.
 */
export function useEditorStoreApi(): EditorStoreApi {
  const store = use(EditorStoreContext);
  if (!store) {
    throw new Error('useEditorStoreApi must be used within an EditorStoreProvider');
  }
  return store;
}
