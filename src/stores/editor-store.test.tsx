import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EditorStoreProvider, useEditorStore } from './editor-store';

function wrapperWith(initialContent?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <EditorStoreProvider initialContent={initialContent}>
        {children}
      </EditorStoreProvider>
    );
  };
}

describe('editor-store', () => {
  it('seeds state from initialContent', () => {
    const { result } = renderHook(() => useEditorStore(s => s.content), {
      wrapper: wrapperWith('hello'),
    });

    expect(result.current).toBe('hello');
  });

  it('isolates state between two provider instances', () => {
    // Two independently-mounted providers must each own a separate store, so
    // writing to one never leaks into the other (the cross-entity-leak bug class
    // this factory exists to prevent).
    const { result: resultA } = renderHook(() => useEditorStore(), { wrapper: wrapperWith('A') });
    const { result: resultB } = renderHook(() => useEditorStore(), { wrapper: wrapperWith('B') });

    act(() => {
      resultA.current.setContent('A-edited');
    });

    expect(resultA.current.content).toBe('A-edited');
    expect(resultB.current.content).toBe('B');
  });

  it('throws when used outside a provider', () => {
    function Consumer() {
      useEditorStore();
      return null;
    }

    // React logs the thrown render error to console; silence it so the
    // fail-on-console setup does not flag this intentional throw.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      'useEditorStore must be used within an EditorStoreProvider',
    );

    spy.mockRestore();
  });

  it('updates the dirty flag', () => {
    function Consumer() {
      const isDirty = useEditorStore(s => s.isDirty);
      const setDirty = useEditorStore(s => s.setDirty);
      return (
        <button type="button" onClick={() => setDirty(true)}>
          {isDirty ? 'dirty' : 'clean'}
        </button>
      );
    }

    render(
      <EditorStoreProvider>
        <Consumer />
      </EditorStoreProvider>,
    );

    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('clean');

    act(() => {
      button.click();
    });

    expect(button).toHaveTextContent('dirty');
  });
});
