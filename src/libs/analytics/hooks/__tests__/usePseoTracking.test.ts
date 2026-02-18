import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePseoTracking } from '../usePseoTracking';

// Mock the entire analytics module
vi.mock('@/libs/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Import after mock
const { trackEvent } = await import('@/libs/analytics');

describe('usePseoTracking', () => {
  const mockTrackEvent = vi.mocked(trackEvent);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document.referrer mock
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  it('tracks event on mount', () => {
    renderHook(() => usePseoTracking('tools', 'password-generator'));

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('tracks event with correct parameters', () => {
    renderHook(() => usePseoTracking('templates', 'nextjs-starter'));

    expect(mockTrackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
      category: 'templates',
      slug: 'nextjs-starter',
      referrer: undefined,
    });
  });

  it('captures referrer from document.referrer', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://google.com/search',
      writable: true,
      configurable: true,
    });

    renderHook(() => usePseoTracking('tools', 'password-generator'));

    expect(mockTrackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'password-generator',
      referrer: 'https://google.com/search',
    });
  });

  it('re-tracks if category changes', () => {
    const { rerender } = renderHook(
      ({ category, slug }) => usePseoTracking(category, slug),
      {
        initialProps: { category: 'tools', slug: 'password-generator' },
      },
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Change category
    rerender({ category: 'templates', slug: 'password-generator' });

    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenLastCalledWith('pseo_page_viewed', {
      category: 'templates',
      slug: 'password-generator',
      referrer: undefined,
    });
  });

  it('re-tracks if slug changes', () => {
    const { rerender } = renderHook(
      ({ category, slug }) => usePseoTracking(category, slug),
      {
        initialProps: { category: 'tools', slug: 'password-generator' },
      },
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Change slug
    rerender({ category: 'tools', slug: 'qr-code-generator' });

    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenLastCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'qr-code-generator',
      referrer: undefined,
    });
  });

  it('does not track on unmount', () => {
    const { unmount } = renderHook(() =>
      usePseoTracking('tools', 'password-generator'),
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    unmount();

    // Should still be called only once
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('handles empty referrer correctly', () => {
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });

    renderHook(() => usePseoTracking('tools', 'password-generator'));

    expect(mockTrackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'password-generator',
      referrer: undefined,
    });
  });
});
