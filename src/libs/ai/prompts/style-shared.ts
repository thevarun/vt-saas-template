/**
 * Shared building blocks for style-aware prompt builders.
 *
 * The `VOICE_SPECTRUM` scale + helpers are product-agnostic: define a 4-axis
 * voice profile (1–5 each), and the builders translate stored values into
 * either short noun labels (for summary/context prompts) or imperative
 * instructions (for generation-time prompts). Strip nothing here when forking —
 * tune the axis copy to your product's voice.
 */

const UNDERSCORE_RE = /_/g;

export const VOICE_SPECTRUM_KEYS = [
  'formalityCasualness',
  'dataStorytelling',
  'aspirationalRelatability',
  'directNuanced',
] as const;

export type VoiceSpectrumKey = typeof VOICE_SPECTRUM_KEYS[number];
export type SpectrumValue = 1 | 2 | 3 | 4 | 5;

export type SpectrumEntry = {
  /** Short noun label, e.g. "very formal" — used as context in summary-style prompts. */
  label: string;
  /** Imperative instruction, e.g. "Write in a formal…" — used at generation time. Omitted for neutral (3). */
  instruction?: string;
};

/**
 * Single source of truth for the 4 voice spectrum dimensions.
 * Each (key, 1–5) entry has a noun `label` for context-style prompts
 * and an `instruction` for generation-time prompts (skipped for neutral 3).
 */
export const VOICE_SPECTRUM: Record<VoiceSpectrumKey, Record<SpectrumValue, SpectrumEntry>> = {
  formalityCasualness: {
    1: { label: 'very formal', instruction: 'Write in a formal, polished register. Avoid contractions and colloquialisms.' },
    2: { label: 'mostly formal', instruction: 'Write in a mostly formal tone with occasional warmth.' },
    3: { label: 'balanced formal/casual' },
    4: { label: 'mostly casual', instruction: 'Write conversationally, like talking to a colleague.' },
    5: { label: 'very casual', instruction: 'Write casually and informally, like a friendly chat.' },
  },
  dataStorytelling: {
    1: { label: 'heavily data-driven', instruction: 'Lead with data, statistics, and evidence. Cite numbers.' },
    2: { label: 'leans data-driven', instruction: 'Favor data and research but weave in brief examples.' },
    3: { label: 'balanced data/storytelling' },
    4: { label: 'leans storytelling', instruction: 'Lead with stories and anecdotes, supported by occasional data.' },
    5: { label: 'heavily storytelling', instruction: 'Tell stories and share experiences. Avoid heavy data.' },
  },
  aspirationalRelatability: {
    1: { label: 'very aspirational', instruction: 'Position as visionary — paint a picture of what\'s possible.' },
    2: { label: 'leans aspirational', instruction: 'Lean aspirational but ground it in achievable steps.' },
    3: { label: 'balanced aspirational/relatable' },
    4: { label: 'leans relatable', instruction: 'Lean relatable — share struggles and honest takes.' },
    5: { label: 'very relatable', instruction: 'Be deeply relatable — vulnerability and real talk.' },
  },
  directNuanced: {
    1: { label: 'very direct', instruction: 'Be bold and assertive. State opinions as convictions.' },
    2: { label: 'leans direct', instruction: 'Be direct but acknowledge key counterpoints.' },
    3: { label: 'balanced direct/nuanced' },
    4: { label: 'leans nuanced', instruction: 'Present multiple perspectives before drawing conclusions.' },
    5: { label: 'very nuanced', instruction: 'Explore nuance thoroughly — avoid strong declarations.' },
  },
};

/**
 * Safely look up a spectrum entry. Returns null for any value that isn't a
 * valid 1-5 integer — guards against legacy/corrupt stored values (e.g. 0, 6,
 * 1.5) that would otherwise blow up downstream `.label` / `.instruction` reads.
 */
export function getSpectrumEntry(key: VoiceSpectrumKey, value: unknown): SpectrumEntry | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5) {
    return null;
  }
  return VOICE_SPECTRUM[key][value as SpectrumValue] ?? null;
}

/** Humanize snake_case enum values: "industry_standard" → "industry standard" */
export function formatEnum(value: string): string {
  return value.replace(UNDERSCORE_RE, ' ');
}

/** Coerce string | string[] | undefined into a comma-joined string, or null when empty. */
export function formatStringOrArray(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : null;
  }
  return value.trim().length > 0 ? value : null;
}
