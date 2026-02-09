/**
 * Validation Tests
 * Tests for event validation and sanitization
 */

import { describe, expect, it } from 'vitest';

import {
  sanitizeErrorMessage,
  sanitizeProperties,
  truncateString,
  validateEventProperties,
} from '../validation';

describe('sanitizeErrorMessage', () => {
  it('removes stack traces', () => {
    const error = 'Error: Something failed\n  at someFunction (file.ts:10:5)\n  at another (file.ts:20:10)';
    const sanitized = sanitizeErrorMessage(error);

    expect(sanitized).toBe('Error: Something failed');
    expect(sanitized).not.toContain('at someFunction');
  });

  it('truncates long messages to 200 characters', () => {
    const longMessage = 'a'.repeat(300);
    const sanitized = sanitizeErrorMessage(longMessage);

    expect(sanitized.length).toBe(200);
  });

  it('removes file paths', () => {
    const error = 'Error in /usr/local/app/src/file.ts';
    const sanitized = sanitizeErrorMessage(error);

    expect(sanitized).toContain('[path]');
    expect(sanitized).not.toContain('/usr/local');
  });

  it('removes email addresses', () => {
    const error = 'Failed to send to user@example.com';
    const sanitized = sanitizeErrorMessage(error);

    expect(sanitized).toContain('[email]');
    expect(sanitized).not.toContain('user@example.com');
  });

  it('handles errors without stack traces', () => {
    const error = 'Simple error message';
    const sanitized = sanitizeErrorMessage(error);

    expect(sanitized).toBe('Simple error message');
  });
});

describe('truncateString', () => {
  it('returns string unchanged if under limit', () => {
    const short = 'Short string';
    const result = truncateString(short, 500);

    expect(result).toBe(short);
  });

  it('truncates string if over limit', () => {
    const long = 'a'.repeat(600);
    const result = truncateString(long, 500);

    expect(result.length).toBe(503); // 500 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('uses default max length of 500', () => {
    const long = 'a'.repeat(600);
    const result = truncateString(long);

    expect(result.length).toBe(503);
  });
});

describe('sanitizeProperties', () => {
  it('redacts password fields', () => {
    const props = {
      username: 'john',
      password: 'secret123',
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.username).toBe('john');
    expect(sanitized.password).toBe('[redacted]');
  });

  it('redacts token fields', () => {
    const props = {
      userId: '123',
      authToken: 'abc123',
      apiToken: 'xyz789',
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.userId).toBe('123');
    expect(sanitized.authToken).toBe('[redacted]');
    expect(sanitized.apiToken).toBe('[redacted]');
  });

  it('redacts secret fields', () => {
    const props = {
      name: 'test',
      clientSecret: 'secret123',
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.name).toBe('test');
    expect(sanitized.clientSecret).toBe('[redacted]');
  });

  it('redacts key fields', () => {
    const props = {
      name: 'test',
      apiKey: 'key123',
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.name).toBe('test');
    expect(sanitized.apiKey).toBe('[redacted]');
  });

  it('truncates long string values', () => {
    const props = {
      description: 'a'.repeat(600),
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.description).toContain('...');
    expect((sanitized.description as string).length).toBeLessThan(600);
  });

  it('preserves non-string values', () => {
    const props = {
      count: 42,
      isActive: true,
      timestamp: new Date('2024-01-01'),
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.count).toBe(42);
    expect(sanitized.isActive).toBe(true);
    expect(sanitized.timestamp).toEqual(new Date('2024-01-01'));
  });

  it('handles case-insensitive sensitive field detection', () => {
    const props = {
      PASSWORD: 'secret',
      Token: 'abc',
      apiKEY: '123',
    };

    const sanitized = sanitizeProperties(props);

    expect(sanitized.PASSWORD).toBe('[redacted]');
    expect(sanitized.Token).toBe('[redacted]');
    expect(sanitized.apiKEY).toBe('[redacted]');
  });
});

describe('validateEventProperties', () => {
  it('returns true for valid properties', () => {
    const result = validateEventProperties('signup_completed', { method: 'email' });

    expect(result).toBe(true);
  });

  it('returns false for null properties', () => {
    const result = validateEventProperties('signup_completed', null as any);

    expect(result).toBe(false);
  });

  it('returns false for undefined properties', () => {
    const result = validateEventProperties('signup_completed', undefined as any);

    expect(result).toBe(false);
  });

  it('returns false for non-object properties', () => {
    const result = validateEventProperties('signup_completed', 'invalid' as any);

    expect(result).toBe(false);
  });

  it('returns true for empty object properties', () => {
    const result = validateEventProperties('signup_started', {});

    expect(result).toBe(true);
  });
});
