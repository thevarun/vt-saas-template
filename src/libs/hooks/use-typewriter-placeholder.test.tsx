import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTypewriterPlaceholder } from './use-typewriter-placeholder';

describe('useTypewriterPlaceholder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty string when disabled', () => {
    const { result } = renderHook(() =>
      useTypewriterPlaceholder({
        prefix: 'Write ',
        suffixes: ['a post'],
        enabled: false,
      }),
    );

    expect(result.current).toBe('');
  });

  it('types the prefix followed by the first suffix character-by-character', () => {
    const { result } = renderHook(() =>
      useTypewriterPlaceholder({
        prefix: 'Write ',
        suffixes: ['ab'],
        typingSpeed: 10,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current).toBe('Write a');

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current).toBe('Write ab');
  });

  it('erases then advances to the next suffix', () => {
    const { result } = renderHook(() =>
      useTypewriterPlaceholder({
        prefix: 'Do ',
        suffixes: ['x', 'y'],
        typingSpeed: 10,
        erasingSpeed: 10,
        pauseDuration: 100,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current).toBe('Do x');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current).toBe('Do ');

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current).toBe('Do y');
  });
});
