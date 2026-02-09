import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as analytics from '@/libs/analytics';

import { PostHogProvider } from '../PostHogProvider';

vi.mock('@/libs/analytics');

describe('PostHogProvider', () => {
  it('calls initAnalytics on mount', () => {
    const initSpy = vi.spyOn(analytics, 'initAnalytics');

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>,
    );

    expect(initSpy).toHaveBeenCalledOnce();
  });

  it('renders children', () => {
    const { getByText } = render(
      <PostHogProvider>
        <div>Test Content</div>
      </PostHogProvider>,
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('only initializes analytics once', () => {
    const initSpy = vi.spyOn(analytics, 'initAnalytics');

    const { rerender } = render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>,
    );

    const firstCallCount = initSpy.mock.calls.length;

    rerender(
      <PostHogProvider>
        <div>Test Updated</div>
      </PostHogProvider>,
    );

    // Should not have additional calls after rerender
    expect(initSpy.mock.calls.length).toBe(firstCallCount);
  });
});
