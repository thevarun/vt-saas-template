/**
 * Structured-output schema for multi-variant draft generation.
 *
 * Generic across products: the model returns N alternative drafts for a single
 * input so the UI can offer a choice. The validator guards length/word-count
 * bounds so a malformed LLM response fails at the boundary instead of leaking
 * into the app. Constrain the count per call via {@link draftOptionsResponseSchema}.
 */

import { z } from 'zod';

export const draftOptionSchema = z.object({
  /** A short label distinguishing this draft from its siblings (e.g. "concise", "detailed"). */
  variant: z.string().min(1).max(120).describe('A short label distinguishing this draft variant'),
  content: z.string().min(50).max(5000).describe('The full draft content for this variant'),
  wordCount: z.number().int().min(10).max(2000),
});

export const draftOptionsResponseSchema = z.object({
  drafts: z.array(draftOptionSchema).min(1).max(5),
});

export type DraftOption = z.infer<typeof draftOptionSchema>;
export type DraftOptionsResponse = z.infer<typeof draftOptionsResponseSchema>;
