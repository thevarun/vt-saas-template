import { describe, expect, it } from 'vitest';

import {
  aiSuggestionSchema,
  aiSuggestionSourceSchema,
  namespaceSuggestionId,
  suggestionBelongsToGroup,
} from './ai-suggestions';

describe('aiSuggestionSourceSchema', () => {
  it('accepts a minimal source with explicit null optional fields', () => {
    const result = aiSuggestionSourceSchema.parse({
      url: 'https://example.com/article',
      title: 'Some article',
      publisher: null,
      publishedAt: null,
      summary: 'One-line summary of the article.',
    });

    expect(result.url).toBe('https://example.com/article');
    expect(result.publisher).toBeNull();
    expect(result.publishedAt).toBeNull();
  });

  it('accepts a fully populated source', () => {
    const result = aiSuggestionSourceSchema.parse({
      url: 'https://example.com/article',
      title: 'Some article',
      publisher: 'Example Times',
      publishedAt: '2026-05-15',
      summary: 'One-line summary.',
    });

    expect(result.publisher).toBe('Example Times');
    expect(result.publishedAt).toBe('2026-05-15');
  });

  it('rejects missing optional fields (explicit null required)', () => {
    const result = aiSuggestionSourceSchema.safeParse({
      url: 'https://example.com',
      title: 't',
      summary: 's',
    });

    expect(result.success).toBe(false);
  });
});

describe('aiSuggestionSchema', () => {
  const valid = {
    id: 's1',
    headline: 'Why hiring for technical fit over culture fit is the real reason early teams break',
    rationale: [
      'First Round Review study: 73% of pre-seed exits trace to founding-team friction.',
      'Founders making early hires will trade list-checking for a values audit if they see the data.',
      'Reinforces a niche of helping early-stage teams build culture-first rather than résumé-first.',
    ],
    sources: [
      {
        url: 'https://review.firstround.com/founding-team',
        title: 'Why the first 3 hires define the company',
        publisher: 'First Round Review',
        publishedAt: '2026-05-16',
        summary: 'A study of 200 early-stage exits points to founder/early-hire friction as the top failure mode.',
      },
    ],
  };

  it('accepts a complete suggestion', () => {
    const result = aiSuggestionSchema.parse(valid);

    expect(result.headline.startsWith('Why')).toBe(true);
    expect(result.rationale).toHaveLength(3);
    expect(result.sources).toHaveLength(1);
  });

  it('accepts zero sources', () => {
    const result = aiSuggestionSchema.parse({ ...valid, sources: [] });

    expect(result.sources).toEqual([]);
  });

  it('accepts 2 rationale bullets (relaxed from exact-3 — provider compliance)', () => {
    const result = aiSuggestionSchema.safeParse({
      ...valid,
      rationale: ['evidence only', 'audience only'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts 4 rationale bullets', () => {
    const result = aiSuggestionSchema.safeParse({
      ...valid,
      rationale: ['a', 'b', 'c', 'd'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects fewer than 2 rationale bullets', () => {
    const result = aiSuggestionSchema.safeParse({
      ...valid,
      rationale: ['only one'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 4 rationale bullets', () => {
    const result = aiSuggestionSchema.safeParse({
      ...valid,
      rationale: ['a', 'b', 'c', 'd', 'e'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects more than 2 sources', () => {
    const result = aiSuggestionSchema.safeParse({
      ...valid,
      sources: [valid.sources[0], valid.sources[0], valid.sources[0]],
    });

    expect(result.success).toBe(false);
  });

  it('strips unknown extra fields', () => {
    const result = aiSuggestionSchema.parse({
      ...valid,
      groupType: 'trending',
    } as unknown as typeof valid);

    expect('groupType' in result).toBe(false);
  });
});

describe('suggestion-id namespacing', () => {
  it('namespaces a positional id by group', () => {
    expect(namespaceSuggestionId('g1', 2)).toBe('g1:s2');
  });

  it('matches ids belonging to a group', () => {
    const id = namespaceSuggestionId('g1', 1);

    expect(suggestionBelongsToGroup(id, 'g1')).toBe(true);
    expect(suggestionBelongsToGroup(id, 'g2')).toBe(false);
  });
});
