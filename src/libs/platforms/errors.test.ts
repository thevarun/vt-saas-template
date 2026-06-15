import { describe, expect, it } from 'vitest';

import { sanitizePlatformError } from './errors';

describe('sanitizePlatformError', () => {
  it('strips the ". Details: …" diagnostics suffix', () => {
    expect(
      sanitizePlatformError('Failed to connect. Details: 401 unauthorized at internal.host'),
    ).toBe('Failed to connect');
  });

  it('leaves a plain message untouched', () => {
    expect(sanitizePlatformError('Failed to connect')).toBe('Failed to connect');
  });
});
