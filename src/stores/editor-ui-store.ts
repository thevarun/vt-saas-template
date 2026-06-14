import { create } from 'zustand';

/**
 * Editor UI preferences that should persist *across* entities within a tab —
 * the module-level singleton Zustand idiom.
 *
 * Kept deliberately separate from the per-entity store (see `editor-store.tsx`),
 * which is scoped to a single entity id and torn down on navigation. State here
 * is a cross-entity user preference — collapsing the side panel while editing
 * entity A should keep it collapsed when you open entity B — so it must NOT
 * reset when the per-entity store remounts.
 *
 * This is the singleton counterpart to the per-entity factory: ONE `create()`
 * at module scope means one shared store for the whole app. `isSidePanelOpen` is
 * just the example preference; a fork adds whatever cross-entity UI flags it
 * needs here.
 */
type EditorUIStore = {
  isSidePanelOpen: boolean;
  setSidePanelOpen: (open: boolean) => void;
};

export const useEditorUIStore = create<EditorUIStore>(set => ({
  isSidePanelOpen: true,
  setSidePanelOpen: isSidePanelOpen => set({ isSidePanelOpen }),
}));
