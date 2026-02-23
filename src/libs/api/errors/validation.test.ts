/**
 * Unit tests for validation error formatters
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  formatZodErrors,
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
