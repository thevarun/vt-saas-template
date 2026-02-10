import { z } from 'zod';

// Database schema type
export type ShareLink = {
  id: string;
  token: string;
  resourceType: string;
  resourceId: string;
  createdBy: string;
  expiresAt: Date | null;
  accessCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// API request/response schemas
export const createShareLinkSchema = z.object({
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().uuid('Invalid resource ID'),
  expiresAt: z.string().datetime().optional(),
});

export const updateShareLinkSchema = z.object({
  isActive: z.boolean(),
});

export type CreateShareLinkRequest = z.infer<typeof createShareLinkSchema>;
export type UpdateShareLinkRequest = z.infer<typeof updateShareLinkSchema>;

export type CreateShareLinkResponse = {
  token: string;
  url: string;
  expiresAt: Date | null;
};

export type ShareLinkAccessResponse = {
  resourceType: string;
  resourceId: string;
  data?: unknown; // Generic data field for resource content
};

export type ShareLinkListResponse = ShareLink[];
