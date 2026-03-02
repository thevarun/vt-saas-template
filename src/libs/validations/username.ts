import { z } from 'zod';

/**
 * Shared username validation schema.
 * Used across API routes, onboarding, and profile pages.
 *
 * Rules: 3-20 chars, lowercase letters, numbers, underscores only.
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores');
