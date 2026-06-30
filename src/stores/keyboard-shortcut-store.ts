import { create } from 'zustand';

type KeyboardShortcutStore = {
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Page components register/unregister their shortcut action handlers
  actionHandlers: Map<string, () => void>;
  registerAction: (id: string, handler: () => void) => void;
  unregisterAction: (id: string) => void;
};

export const useKeyboardShortcutStore = create<KeyboardShortcutStore>(set => ({
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: isCommandPaletteOpen => set({ isCommandPaletteOpen }),

  actionHandlers: new Map(),
  registerAction: (id, handler) =>
    set((state) => {
      const next = new Map(state.actionHandlers);
      next.set(id, handler);
      return { actionHandlers: next };
    }),
  unregisterAction: id =>
    set((state) => {
      const next = new Map(state.actionHandlers);
      next.delete(id);
      return { actionHandlers: next };
    }),
}));
