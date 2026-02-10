import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PseoPageTracker } from '../PseoPageTracker';

// Mock the entire analytics module
vi.mock('@/libs/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Import after mock
const { trackEvent } = await import('@/libs/analytics');

describe('PseoPageTracker', () => {
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

  it('renders without errors', () => {
    const { container } = render(
      <PseoPageTracker category="tools" slug="password-generator" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('tracks event on mount', () => {
    render(<PseoPageTracker category="tools" slug="password-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('tracks event with correct event name', () => {
    render(<PseoPageTracker category="tools" slug="password-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'pseo_page_viewed',
      expect.any(Object),
    );
  });

  it('tracks event with category and slug props', () => {
    render(<PseoPageTracker category="templates" slug="nextjs-starter" />);

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

    render(<PseoPageTracker category="tools" slug="password-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'password-generator',
      referrer: 'https://google.com/search',
    });
  });

  it('does not re-track on re-render with same props', () => {
    const { rerender } = render(
      <PseoPageTracker category="tools" slug="password-generator" />,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<PseoPageTracker category="tools" slug="password-generator" />);

    // Should still be called only once (deps haven't changed)
    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });

  it('re-tracks when category changes', () => {
    const { rerender } = render(
      <PseoPageTracker category="tools" slug="password-generator" />,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Change category
    rerender(<PseoPageTracker category="templates" slug="password-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenLastCalledWith('pseo_page_viewed', {
      category: 'templates',
      slug: 'password-generator',
      referrer: undefined,
    });
  });

  it('re-tracks when slug changes', () => {
    const { rerender } = render(
      <PseoPageTracker category="tools" slug="password-generator" />,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);

    // Change slug
    rerender(<PseoPageTracker category="tools" slug="qr-code-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    expect(mockTrackEvent).toHaveBeenLastCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'qr-code-generator',
      referrer: undefined,
    });
  });

  it('handles empty referrer correctly', () => {
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });

    render(<PseoPageTracker category="tools" slug="password-generator" />);

    expect(mockTrackEvent).toHaveBeenCalledWith('pseo_page_viewed', {
      category: 'tools',
      slug: 'password-generator',
      referrer: undefined,
    });
  });
});
