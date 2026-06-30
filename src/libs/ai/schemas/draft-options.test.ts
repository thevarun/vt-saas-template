import { describe, expect, it } from 'vitest';

import { draftOptionSchema, draftOptionsResponseSchema } from './draft-options';

describe('draftOptionSchema', () => {
  const validContent
    = 'This is some draft content that is long enough to pass the minimum length validation requirement.';

  it('validates a correct draft option', () => {
    const result = draftOptionSchema.safeParse({
      variant: 'concise',
      content: validContent,
      wordCount: 150,
    });

    expect(result.success).toBe(true);
  });

  it('fails when variant is empty', () => {
    const result = draftOptionSchema.safeParse({
      variant: '',
      content: validContent,
      wordCount: 50,
    });

    expect(result.success).toBe(false);
  });

  it('fails when content is missing', () => {
    const result = draftOptionSchema.safeParse({
      variant: 'detailed',
      wordCount: 50,
    });

    expect(result.success).toBe(false);
  });

  it('fails when wordCount is negative', () => {
    const result = draftOptionSchema.safeParse({
      variant: 'concise',
      content: validContent,
      wordCount: -1,
    });

    expect(result.success).toBe(false);
  });

  it('fails when wordCount is not an integer', () => {
    const result = draftOptionSchema.safeParse({
      variant: 'concise',
      content: validContent,
      wordCount: 50.5,
    });

    expect(result.success).toBe(false);
  });

  it('fails when content is too short (under 50 chars)', () => {
    const result = draftOptionSchema.safeParse({
      variant: 'concise',
      content: 'Too short',
      wordCount: 2,
    });

    expect(result.success).toBe(false);
  });
});

describe('draftOptionsResponseSchema', () => {
  const validDraft = (variant: string) => ({
    variant,
    content: 'This is some draft content that is long enough to pass the minimum length validation requirement.',
    wordCount: 150,
  });

  it('validates a response with a single draft', () => {
    const result = draftOptionsResponseSchema.safeParse({
      drafts: [validDraft('concise')],
    });

    expect(result.success).toBe(true);
  });

  it('validates a response with the maximum 5 drafts', () => {
    const result = draftOptionsResponseSchema.safeParse({
      drafts: [
        validDraft('a'),
        validDraft('b'),
        validDraft('c'),
        validDraft('d'),
        validDraft('e'),
      ],
    });

    expect(result.success).toBe(true);
  });

  it('fails with more than 5 drafts', () => {
    const result = draftOptionsResponseSchema.safeParse({
      drafts: [
        validDraft('a'),
        validDraft('b'),
        validDraft('c'),
        validDraft('d'),
        validDraft('e'),
        validDraft('f'),
      ],
    });

    expect(result.success).toBe(false);
  });

  it('fails when drafts array is empty', () => {
    const result = draftOptionsResponseSchema.safeParse({ drafts: [] });

    expect(result.success).toBe(false);
  });
});
