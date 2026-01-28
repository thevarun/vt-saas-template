import '@testing-library/jest-dom/vitest';

import failOnConsole from 'vitest-fail-on-console';

// Mock browser APIs not available in jsdom (needed for Radix UI components)
// Only apply in jsdom environment (where Element is defined)
if (typeof Element !== 'undefined') {
  Object.defineProperty(Element.prototype, 'hasPointerCapture', {
    value: () => false,
    writable: true,
  });
  Object.defineProperty(Element.prototype, 'setPointerCapture', {
    value: () => {},
    writable: true,
  });
  Object.defineProperty(Element.prototype, 'releasePointerCapture', {
    value: () => {},
    writable: true,
  });
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => {},
    writable: true,
  });
}

failOnConsole({
  shouldFailOnDebug: true,
  shouldFailOnError: true,
  shouldFailOnInfo: true,
  shouldFailOnLog: true,
  shouldFailOnWarn: true,
});

// Set up environment variables for testing
process.env.BILLING_PLAN_ENV = 'test';
