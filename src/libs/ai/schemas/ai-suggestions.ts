/**
 * Structured-output schema for AI-generated suggestions backed by cited sources.
 *
 * Generic across products: a suggestion is one short idea, a few bullet rationale
 * lines, and 0-N cited sources drawn from research results. The bounds are
 * deliberately relaxed (ranges, not exact counts) so structured-output
 * generations don't fail on off-by-one provider compliance.
 */

import { z } from 'zod';

/** A single cited source backing a suggestion. */
export const aiSuggestionSourceSchema = z.object({
  url: z.string().describe('Canonical URL of the source. Must be a full https://… URL drawn from the research results.'),
  title: z.string().describe('Source title'),
  publisher: z.string().nullable().describe('Publisher name (e.g., "TechCrunch"). Use null when unknown.'),
  publishedAt: z.string().nullable().describe('ISO date string when the source was published. Use null when unknown.'),
  summary: z.string().describe('1–2 line summary of what this source actually says'),
});

/** Single suggestion returned by the generator. */
export const aiSuggestionSchema = z.object({
  id: z.string().describe('Stable identifier for this suggestion'),
  headline: z
    .string()
    .describe('One short inquiry-style phrase (≤ ~120 chars). The reader should be curious enough to want the answer.'),
  rationale: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('2–4 short bullets (≤ ~120 chars each) explaining why this suggestion is worth pursuing. Prefer exactly 3; relaxed to a range so structured-output generations don\'t fail on count.'),
  sources: z
    .array(aiSuggestionSourceSchema)
    .min(0)
    .max(2)
    .describe('0–2 cited sources from the research; reference the actual results surfaced'),
});

/** Final flat API response shape. */
export const aiSuggestionsResponseSchema = z.object({
  suggestions: z.array(aiSuggestionSchema).min(1).max(15),
});

export type AiSuggestionSource = z.infer<typeof aiSuggestionSourceSchema>;
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiSuggestionsResponse = z.infer<typeof aiSuggestionsResponseSchema>;

// ---------------------------------------------------------------------------
// Suggestion-id namespacing
//
// Parallel generation groups each emit positional ids ("s1", "s2", …); namespace
// them by groupId so they can't collide on a flat grid (React keys + lookup).
// The encoding is produced server-side and decoded client-side, so it lives here
// — the one module both sides already import — to keep the two ends from drifting.
// ---------------------------------------------------------------------------

/** Build the grid-unique id for the Nth (1-based) suggestion in a group. */
export function namespaceSuggestionId(groupId: string, position: number): string {
  return `${groupId}:s${position}`;
}

/** Whether a namespaced suggestion id belongs to the given group. */
export function suggestionBelongsToGroup(id: string, groupId: string): boolean {
  return id.startsWith(`${groupId}:`);
}
