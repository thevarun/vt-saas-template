import type { ErrorInfo, ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component
 */
export type ErrorBoundaryProps = {
  /** Child components to protect */
  children: ReactNode;
  /** Custom fallback UI (can be a component or render function) */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

/**
 * State for the ErrorBoundary component
 */
export type ErrorBoundaryState = {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error (if any) */
  error: Error | null;
};

/**
 * Props for error fallback components
 */
export type ErrorFallbackProps = {
  /** The error that was caught */
  error: Error;
  /** Function to reset the error boundary and retry */
  onReset: () => void;
  /** Optional custom message */
  message?: string;
};
