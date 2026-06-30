/** Structured-output schema for AI-generated hashtags (returned without the # prefix). */

import { z } from 'zod';

export const hashtagsResponseSchema = z.object({
  hashtags: z
    .array(z.string().describe('A relevant hashtag without the # prefix'))
    .min(1)
    .max(5),
});

export type HashtagsResponse = z.infer<typeof hashtagsResponseSchema>;
