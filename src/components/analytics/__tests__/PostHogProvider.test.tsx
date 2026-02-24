import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as analytics from '@/libs/analytics';

import { PostHogProvider } from '../PostHogProvider';

vi.mock('@/libs/analytics');

describe('PostHogProvider', () => {
  let ricCallback: (() => void) | null = null;

  beforeEach(() => {
    ricCallback = null;
    // jsdom has no requestIdleCallback/cancelIdleCallback, so we define both
    window.requestIdleCallback = vi.fn((cb: IdleRequestCallback) => {
      ricCallback = () => cb({} as IdleDeadline);
      return 1;
    }) as any;
    window.cancelIdleCallback = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defers initAnalytics via requestIdleCallback instead of calling synchronously', () => {
    const initSpy = vi.spyOn(analytics, 'initAnalytics');

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>,
    );

    // requestIdleCallback should have been called to schedule init
    expect(window.requestIdleCallback).toHaveBeenCalledOnce();

    // initAnalytics should not be called until the idle callback fires
    expect(initSpy).not.toHaveBeenCalled();
  });

  it('calls initAnalytics when idle callback fires', () => {
    const initSpy = vi.spyOn(analytics, 'initAnalytics');

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>,
    );

    expect(ricCallback).not.toBeNull();

    ricCallback!();

    expect(initSpy).toHaveBeenCalledOnce();
  });

  it('renders children immediately before analytics init', () => {
    render(
      <PostHogProvider>
        <div>Test Content</div>
      </PostHogProvider>,
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    // Remove requestIdleCallback to trigger the setTimeout fallback path
    // @ts-expect-error -- deliberately removing for test
    delete window.requestIdleCallback;

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    vi.spyOn(analytics, 'initAnalytics');

    render(
      <PostHogProvider>
        <div>Test</div>
      </PostHogProvider>,
    );

    // Should have used setTimeout as fallback (at least one call with delay of 1)
    const timeoutCalls = setTimeoutSpy.mock.calls;
    const hasFallbackCall = timeoutCalls.some(
      ([, delay]) => delay === 1,
    );

    expect(hasFallbackCall).toBe(true);

    setTimeoutSpy.mockRestore();
  });
});
