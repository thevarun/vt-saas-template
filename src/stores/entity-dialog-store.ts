import { create } from 'zustand';

/**
 * Discriminated-union dialog store — a third distinct Zustand idiom.
 *
 * Modelling dialog state as a tagged union (rather than a loose
 * `{ isOpen: boolean; mode: string; id?: string }`) makes illegal states
 * unrepresentable: an `edit` dialog ALWAYS carries an `entityId`, a `closed`
 * dialog NEVER does, and `tsc` enforces it at every consumer. A fork copies this
 * for any create/edit modal driven from multiple call-sites.
 */
export type EntityDialogMode
  = | { kind: 'closed' }
    | { kind: 'create' }
    | { kind: 'edit'; entityId: string };

type EntityDialogStore = {
  mode: EntityDialogMode;
  openCreate: () => void;
  openEdit: (entityId: string) => void;
  close: () => void;
};

export const useEntityDialogStore = create<EntityDialogStore>(set => ({
  mode: { kind: 'closed' },
  openCreate: () => set({ mode: { kind: 'create' } }),
  openEdit: (entityId: string) => set({ mode: { kind: 'edit', entityId } }),
  close: () => set({ mode: { kind: 'closed' } }),
}));
