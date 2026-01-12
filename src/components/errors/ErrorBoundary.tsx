import * as Sentry from '@sentry/nextjs';
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { CardErrorFallback } from './ErrorFallback';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './types';

/**
 * ErrorBoundary Component
 *
 * Reusable React error boundary for protecting critical components.
 * Catches errors in child components and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => <CustomFallback error={error} onReset={reset} />}
 *   onError={(error) => console.log('Component error:', error)}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * Features:
 * - Catches rendering errors in children
 * - Provides reset mechanism to retry
 * - Logs errors to Sentry automatically
 * - Custom fallback UI support
 * - Optional error callback
 *
 * Note: Error boundaries are class components (React limitation).
 * They cannot catch:
 * - Event handler errors (use try/catch)
 * - Async code errors (use try/catch or .catch())
 * - Errors in the error boundary itself
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error to Sentry and call optional error callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to Sentry with component context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        errorBoundary: {
          type: 'component',
        },
      },
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  /**
   * Reset error state and retry rendering children
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.resetError);
        }
        return this.props.fallback;
      }

      // Render default fallback
      return (
        <CardErrorFallback
          error={this.state.error}
          onReset={this.resetError}
        />
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}
