import { describe, expect, it } from 'vitest';

import type { StyleData } from './style-context';
import { buildStyleContext } from './style-context';

describe('buildStyleContext', () => {
  describe('primary path (aiSummary present)', () => {
    it('outputs only summary + strategic context + signature elements', () => {
      const data: StyleData = {
        aiSummary: 'Write with authority and warmth.',
        tone: 'Professional but warm',
        jargonLevel: 'industry_standard',
        formalityCasualness: 4,
        dataStorytelling: 2,
        targetAudience: ['Engineering managers', 'Tech founders'],
        professionalIdentity: ['Senior PM', 'Thought leader'],
        contentGoal: ['Drive newsletter signups', 'Build authority'],
        bannedWords: ['leverage', 'synergy'],
        signaturePhrases: ['Here\'s the thing...', 'Stay curious.'],
      };

      const result = buildStyleContext(data, 'My Pro Style');

      // Present: summary, strategic context, signature elements
      expect(result).toContain('## Writing Style: My Pro Style');
      expect(result).toContain('Write with authority and warmth.');
      expect(result).toContain('### Write for');
      expect(result).toContain('Audience: Engineering managers, Tech founders');
      expect(result).toContain('Author identity: Senior PM, Thought leader');
      expect(result).toContain('Content goal: Drive newsletter signups, Build authority');
      expect(result).toContain('### Must Avoid\nleverage, synergy');
      expect(result).toContain('### Signature Phrases (use naturally)\nHere\'s the thing..., Stay curious.');

      // Absent: voice spectrum and guidelines (captured by summary)
      expect(result).not.toContain('### Voice Profile');
      expect(result).not.toContain('### Guidelines');
      expect(result).not.toContain('Tone:');
      expect(result).not.toContain('Jargon Level:');
    });

    it('places aiSummary before strategic context and signature elements', () => {
      const data: StyleData = {
        aiSummary: 'Voice DNA paragraph here.',
        targetAudience: 'Developers',
        bannedWords: ['synergy'],
      };

      const result = buildStyleContext(data, 'Order Test');

      const summaryIndex = result.indexOf('Voice DNA paragraph here.');
      const writeForIndex = result.indexOf('### Write for');
      const avoidIndex = result.indexOf('### Must Avoid');

      expect(summaryIndex).toBeGreaterThan(-1);
      expect(writeForIndex).toBeGreaterThan(-1);
      expect(avoidIndex).toBeGreaterThan(-1);
      expect(summaryIndex).toBeLessThan(writeForIndex);
      expect(writeForIndex).toBeLessThan(avoidIndex);
    });
  });

  describe('fallback path (no aiSummary)', () => {
    it('renders full structured fields when aiSummary is missing', () => {
      const data: StyleData = {
        tone: 'Professional but warm',
        jargonLevel: 'industry_standard',
        formalityCasualness: 4,
        dataStorytelling: 2,
        aspirationalRelatability: 1,
        directNuanced: 5,
        targetAudience: ['Engineering managers'],
        bannedWords: ['leverage'],
      };

      const result = buildStyleContext(data, 'Fallback Style');

      expect(result).toContain('### Voice Profile');
      expect(result).toContain('Write conversationally, like talking to a colleague.');
      expect(result).toContain('Favor data and research but weave in brief examples.');
      expect(result).toContain('### Guidelines');
      expect(result).toContain('- Tone: Professional but warm');
      expect(result).toContain('- Jargon Level: industry standard');
      expect(result).toContain('### Write for');
      expect(result).toContain('### Must Avoid');
    });

    it('treats empty string aiSummary as fallback', () => {
      const data: StyleData = {
        aiSummary: '',
        tone: 'Casual',
        formalityCasualness: 5,
      };

      const result = buildStyleContext(data, 'Empty Summary');

      expect(result).toContain('### Voice Profile');
      expect(result).toContain('### Guidelines');
      expect(result).toContain('- Tone: Casual');
    });

    it('skips out-of-range spectrum values without crashing', () => {
      // Legacy/corrupt stored values could be 0, 6, or non-integers. The lookup
      // must degrade gracefully rather than throw and break the consuming route.
      const data = {
        formalityCasualness: 0,
        dataStorytelling: 6,
        aspirationalRelatability: 1.5,
        directNuanced: 4, // valid — should still render
      } as unknown as StyleData;

      const result = buildStyleContext(data, 'Corrupt');

      expect(result).toContain('### Voice Profile');
      // Only the valid value emits a line
      expect(result).toContain('Present multiple perspectives before drawing conclusions.');
      // Out-of-range values produce no spectrum lines
      expect(result.match(/Voice Profile\n(- [^\n]+\n?)+/)?.[0]).toContain('Present multiple perspectives');
    });

    it('treats whitespace-only aiSummary as fallback', () => {
      const data: StyleData = {
        aiSummary: '   ',
        tone: 'Direct',
      };

      const result = buildStyleContext(data, 'Whitespace Summary');

      expect(result).toContain('### Guidelines');
      expect(result).toContain('- Tone: Direct');
    });
  });

  describe('shared behavior', () => {
    it('includes strategic context in both paths', () => {
      const withSummary = buildStyleContext(
        { aiSummary: 'Some summary.', targetAudience: 'Devs' },
        'With',
      );
      const withoutSummary = buildStyleContext(
        { targetAudience: 'Devs' },
        'Without',
      );

      expect(withSummary).toContain('### Write for\nAudience: Devs');
      expect(withoutSummary).toContain('### Write for\nAudience: Devs');
    });

    it('includes signature elements in both paths', () => {
      const withSummary = buildStyleContext(
        { aiSummary: 'Summary.', bannedWords: ['leverage'], signaturePhrases: ['Stay curious.'] },
        'With',
      );
      const withoutSummary = buildStyleContext(
        { bannedWords: ['leverage'], signaturePhrases: ['Stay curious.'] },
        'Without',
      );

      for (const result of [withSummary, withoutSummary]) {
        expect(result).toContain('### Must Avoid\nleverage');
        expect(result).toContain('### Signature Phrases (use naturally)\nStay curious.');
      }
    });

    it('handles legacy string values for strategic context', () => {
      const result = buildStyleContext(
        { aiSummary: 'Summary.', targetAudience: 'Engineering managers at startups' },
        'Legacy',
      );

      expect(result).toContain('Audience: Engineering managers at startups');
    });

    it('returns only the header for empty StyleData', () => {
      const result = buildStyleContext({}, 'Empty Style');

      expect(result).toBe('## Writing Style: Empty Style');
    });

    it('omits voice spectrum for neutral values (3) in fallback', () => {
      const data: StyleData = {
        formalityCasualness: 3,
        dataStorytelling: 3,
        aspirationalRelatability: 3,
        directNuanced: 3,
      };

      const result = buildStyleContext(data, 'Neutral');

      expect(result).not.toContain('### Voice Profile');
    });
  });
});
