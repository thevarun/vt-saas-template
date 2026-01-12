import * as Sentry from '@sentry/nextjs';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Component that throws an error
function ErrorThrower({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal render</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  // React logs errors caught by error boundaries to console
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches error and renders default fallback', () => {
    render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    // Default CardErrorFallback should be rendered
    expect(screen.getByText('Component Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong while loading this section.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('logs error to Sentry when caught', () => {
    const captureExceptionSpy = vi.mocked(Sentry.captureException);

    render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    expect(captureExceptionSpy).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          react: expect.any(Object),
          errorBoundary: expect.objectContaining({
            type: 'component',
          }),
        }),
      }),
    );
  });

  it('calls onError callback when error is caught', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders custom fallback function when provided', () => {
    const fallbackFn = (error: Error, reset: () => void) => (
      <div>
        <p>
          Error:
          {error.message}
        </p>
        <button type="button" onClick={reset}>Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/error:/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('resets error state when reset is called', async () => {
    const user = userEvent.setup();

    // Track if component should throw
    let shouldThrow = true;

    // Component that can be toggled
    function TogglableErrorThrower() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Normal render</div>;
    }

    const fallbackFn = (_error: Error, reset: () => void) => (
      <button
        type="button"
        onClick={() => {
          shouldThrow = false; // Stop throwing
          reset(); // Reset error boundary
        }}
      >
        Reset
      </button>
    );

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <TogglableErrorThrower />
      </ErrorBoundary>,
    );

    // Error fallback should be shown
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

    // Click reset button - this should stop throwing and reset
    await user.click(screen.getByRole('button', { name: /reset/i }));

    // Normal content should be shown after reset
    expect(screen.getByText('Normal render')).toBeInTheDocument();
  });

  it('catches multiple errors in sequence', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    // First error caught
    expect(screen.getByText('Component Error')).toBeInTheDocument();

    // Rerender with different error
    rerender(
      <ErrorBoundary>
        <ErrorThrower />
      </ErrorBoundary>,
    );

    // Should still show error fallback
    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });
});
