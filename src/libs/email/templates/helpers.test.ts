import { describe, expect, it } from 'vitest';

import { safeGreeting } from './helpers';

describe('safeGreeting', () => {
  it('returns a generic greeting when the name is blank', () => {
    expect(safeGreeting('')).toBe('Hi there,');
    expect(safeGreeting('   ')).toBe('Hi there,');
  });

  it('returns a generic greeting when the name is undefined', () => {
    expect(safeGreeting()).toBe('Hi there,');
  });

  it('returns a generic greeting when the name looks like an email', () => {
    expect(safeGreeting('user@example.com')).toBe('Hi there,');
  });

  it('returns a personalized greeting for a real name', () => {
    expect(safeGreeting('Alex')).toBe('Hi Alex,');
  });

  it('trims surrounding whitespace from the name', () => {
    expect(safeGreeting('  Alex  ')).toBe('Hi Alex,');
  });
});
