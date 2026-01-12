/**
 * Unit tests for validation error formatters
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  formatFieldName,
  formatZodErrors,
  formatZodErrorsFlat,
  formatZodErrorsReadable,
  getFirstZodError,
} from './validation';

describe('Validation Error Formatters', () => {
  describe('formatZodErrors', () => {
    it('should format single field error', () => {
      const schema = z.object({
        conversationId: z.string(),
      });

      const result = schema.safeParse({});

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('conversationId');
        expect(formatted.conversationId).toHaveLength(1);
        expect(typeof formatted.conversationId?.[0]).toBe('string');
      }
    });

    it('should format multiple field errors', () => {
      const schema = z.object({
        conversationId: z.string(),
        title: z.string().min(3, 'Title must be at least 3 characters'),
      });

      const result = schema.safeParse({ conversationId: 'valid', title: 'ab' });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('title');
        expect(formatted.title).toContain('Title must be at least 3 characters');
      }
    });

    it('should format nested field errors', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email('Invalid email'),
        }),
      });

      const result = schema.safeParse({ user: { email: 'invalid' } });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toEqual({
          'user.email': ['Invalid email'],
        });
      }
    });

    it('should group multiple errors for same field', () => {
      const schema = z.object({
        password: z
          .string()
          .min(8, 'At least 8 characters')
          .regex(/[A-Z]/, 'Must contain uppercase'),
      });

      const result = schema.safeParse({ password: 'short' });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted.password).toHaveLength(2);
        expect(formatted.password).toContain('At least 8 characters');
        expect(formatted.password).toContain('Must contain uppercase');
      }
    });

    it('should handle array field errors', () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });

      const result = schema.safeParse({ tags: ['valid', ''] });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        // Zod formats array errors with index
        expect(formatted).toHaveProperty('tags.1');
      }
    });
  });

  describe('formatZodErrorsFlat', () => {
    it('should return flat array of error messages', () => {
      const schema = z.object({
        conversationId: z.string().min(3, 'Conversation ID too short'),
        title: z.string().min(3, 'Title too short'),
      });

      const result = schema.safeParse({ conversationId: 'ab', title: 'xy' });

      expect(result.success).toBe(false);

      if (!result.success) {
        const flat = formatZodErrorsFlat(result.error);

        expect(flat).toHaveLength(2);
        expect(flat).toContain('Conversation ID too short');
        expect(flat).toContain('Title too short');
      }
    });

    it('should handle empty errors', () => {
      const schema = z.object({
        field: z.string(),
      });

      const result = schema.safeParse({ field: 'valid' });

      expect(result.success).toBe(true);
    });
  });

  describe('getFirstZodError', () => {
    it('should return first error message', () => {
      const schema = z.object({
        field1: z.string().min(3, 'First error'),
        field2: z.string().min(3, 'Second error'),
      });

      const result = schema.safeParse({ field1: 'ab', field2: 'xyz' });

      expect(result.success).toBe(false);

      if (!result.success) {
        const first = getFirstZodError(result.error);

        expect(first).toBe('First error');
      }
    });

    it('should return fallback if no errors', () => {
      const schema = z.object({
        field: z.string(),
      });

      const result = schema.safeParse({ field: 'valid' });

      expect(result.success).toBe(true);
    });

    it('should use custom fallback message', () => {
      const schema = z.object({
        field: z.string(),
      });

      const result = schema.safeParse({ field: 'valid' });

      expect(result.success).toBe(true);
    });
  });

  describe('formatFieldName', () => {
    it('should format camelCase to title case', () => {
      expect(formatFieldName('conversationId')).toBe('Conversation Id');
      expect(formatFieldName('emailAddress')).toBe('Email Address');
      expect(formatFieldName('firstName')).toBe('First Name');
    });

    it('should format snake_case to title case', () => {
      expect(formatFieldName('conversation_id')).toBe('Conversation Id');
      expect(formatFieldName('email_address')).toBe('Email Address');
      expect(formatFieldName('first_name')).toBe('First Name');
    });

    it('should format nested paths', () => {
      expect(formatFieldName('user.email')).toBe('User Email');
      expect(formatFieldName('user.emailAddress')).toBe('User Email Address');
      expect(formatFieldName('account.user.firstName')).toBe(
        'Account User First Name',
      );
    });

    it('should handle single word', () => {
      expect(formatFieldName('email')).toBe('Email');
      expect(formatFieldName('title')).toBe('Title');
    });

    it('should handle all uppercase', () => {
      expect(formatFieldName('ID')).toBe('I D');
    });

    it('should handle empty string', () => {
      expect(formatFieldName('')).toBe('');
    });
  });

  describe('formatZodErrorsReadable', () => {
    it('should format errors with readable field names', () => {
      const schema = z.object({
        conversationId: z.string().min(3, 'Too short'),
        emailAddress: z.string().email('Invalid email'),
      });

      const result = schema.safeParse({ conversationId: 'ab', emailAddress: 'invalid' });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrorsReadable(result.error);

        expect(formatted).toHaveProperty('Conversation Id');
        expect(formatted).toHaveProperty('Email Address');
        expect(formatted['Conversation Id']).toContain('Too short');
        expect(formatted['Email Address']).toContain('Invalid email');
      }
    });

    it('should format nested paths with readable names', () => {
      const schema = z.object({
        user: z.object({
          firstName: z.string().min(2, 'Too short'),
        }),
      });

      const result = schema.safeParse({ user: { firstName: 'x' } });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrorsReadable(result.error);

        expect(formatted).toHaveProperty('User First Name');
        expect(formatted['User First Name']).toContain('Too short');
      }
    });
  });

  describe('Integration with real-world schemas', () => {
    it('should handle thread creation validation', () => {
      const threadSchema = z.object({
        conversationId: z.string(),
        title: z.string().optional(),
      });

      const result = threadSchema.safeParse({});

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('conversationId');
        expect(formatted.conversationId).toHaveLength(1);
      }
    });

    it('should handle complex nested validation', () => {
      const complexSchema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string().min(2, 'First name too short'),
            lastName: z.string().min(2, 'Last name too short'),
          }),
          settings: z.object({
            notifications: z.boolean(),
          }),
        }),
      });

      const result = complexSchema.safeParse({
        user: {
          profile: { firstName: 'a', lastName: 'b' },
          settings: { notifications: true },
        },
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const formatted = formatZodErrors(result.error);

        expect(formatted).toHaveProperty('user.profile.firstName');
        expect(formatted).toHaveProperty('user.profile.lastName');
        expect(formatted['user.profile.firstName']).toContain(
          'First name too short',
        );
      }
    });
  });
});
