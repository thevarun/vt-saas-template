/* eslint-disable react-refresh/only-export-components -- test utilities don't need fast refresh */
import * as React from 'react';

/**
 * Error Testing Utilities
 *
 * Utilities for testing error boundaries and error handling.
 * Use these only in development/test environments.
 */

/**
 * Throws a test error immediately
 * Useful for testing error boundaries
 */
export function throwTestError(message = 'Test error'): never {
  throw new Error(message);
}

/**
 * Throws an error after a delay
 * Useful for testing async error handling
 */
export async function triggerAsyncError(message = 'Async test error', delayMs = 100): Promise<never> {
  await new Promise(resolve => setTimeout(resolve, delayMs));
  throw new Error(message);
}

/**
 * ErrorThrower Component
 *
 * React component that throws an error when mounted.
 * Use this to test error boundaries in component tests.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ErrorThrower message="Test error" />
 * </ErrorBoundary>
 * ```
 */
export function ErrorThrower({ message = 'Test error', shouldThrow = true }: {
  message?: string;
  shouldThrow?: boolean;
}) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Normal render</div>;
}

/**
 * AsyncErrorThrower Component
 *
 * React component that throws an error after mounting (in useEffect).
 * Note: Error boundaries don't catch errors in useEffect,
 * so this is mainly for testing that errors are NOT caught.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <AsyncErrorThrower message="Async test error" />
 * </ErrorBoundary>
 * ```
 */
export function AsyncErrorThrower({ message = 'Async test error', delayMs = 100 }: {
  message?: string;
  delayMs?: number;
}) {
  React.useEffect(() => {
    setTimeout(() => {
      throw new Error(message);
    }, delayMs);
  }, [message, delayMs]);

  return <div>Async error component</div>;
}
