import { useEffect, useState } from 'react';

type ValidationState = {
  isValid: boolean;
  isAvailable: boolean | null;
  error: string | null;
  isChecking: boolean;
};

export function useUsernameValidation(username: string, skip: boolean = false, debounceMs: number = 300) {
  const [state, setState] = useState<ValidationState>({
    isValid: false,
    isAvailable: null,
    error: null,
    isChecking: false,
  });

  useEffect(() => {
    // If skip is true, return valid state (used when username hasn't changed)
    if (skip) {
      setState({
        isValid: true,
        isAvailable: true,
        error: null,
        isChecking: false,
      });
      return;
    }

    // Reset state if username is empty
    if (!username) {
      setState({
        isValid: false,
        isAvailable: null,
        error: null,
        isChecking: false,
      });
      return;
    }

    // Validate format immediately
    const formatRegex = /^[a-z0-9_]+$/;
    if (username.length < 3) {
      setState({
        isValid: false,
        isAvailable: null,
        error: '3-20 characters, lowercase letters, numbers, underscores only',
        isChecking: false,
      });
      return;
    }

    if (username.length > 20) {
      setState({
        isValid: false,
        isAvailable: null,
        error: '3-20 characters, lowercase letters, numbers, underscores only',
        isChecking: false,
      });
      return;
    }

    if (!formatRegex.test(username)) {
      setState({
        isValid: false,
        isAvailable: null,
        error: '3-20 characters, lowercase letters, numbers, underscores only',
        isChecking: false,
      });
      return;
    }

    // Debounce API call
    setState(prev => ({ ...prev, isChecking: true, error: null }));

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/profile/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok && data.available) {
          setState({
            isValid: true,
            isAvailable: true,
            error: null,
            isChecking: false,
          });
        } else if (response.ok && !data.available) {
          setState({
            isValid: false,
            isAvailable: false,
            error: 'Username taken',
            isChecking: false,
          });
        } else {
          setState({
            isValid: false,
            isAvailable: null,
            error: data.error || 'Failed to check availability',
            isChecking: false,
          });
        }
      } catch {
        setState({
          isValid: false,
          isAvailable: null,
          error: 'Network error',
          isChecking: false,
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, skip, debounceMs]);

  return state;
}
