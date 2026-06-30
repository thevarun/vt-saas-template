/**
 * Builder that compiles a user's stored style profile into a prompt-ready text
 * section. This is the canonical "input → prompt string" builder pattern: a pure
 * function with no IO, composed from small section builders.
 *
 * When `aiSummary` is present it's used as the sole voice signal, with strategic
 * context and signature elements added as explicit supplements; otherwise it
 * falls back to the full structured fields.
 *
 * {@link StyleData} is the generic input shape — wire it to whatever your product
 * persists for a writing/voice profile (e.g. a `jsonb` column).
 */

import { formatEnum, formatStringOrArray, getSpectrumEntry, VOICE_SPECTRUM_KEYS } from './style-shared';

/**
 * Generic style-profile input for the prompt builders. All fields optional so a
 * partially-configured profile still produces a valid (smaller) prompt section.
 */
export type StyleData = {
  // Strategic context (single string or multi-select arrays)
  targetAudience?: string | string[];
  professionalIdentity?: string | string[];
  contentGoal?: string | string[];

  // Voice spectrum (1-5 scale, 3 = neutral) — see VOICE_SPECTRUM
  formalityCasualness?: number;
  dataStorytelling?: number;
  aspirationalRelatability?: number;
  directNuanced?: number;

  // Structured voice & structure attributes (free-form or snake_case enums)
  tone?: string;
  jargonLevel?: string;
  postLength?: string;
  openingStyle?: string;
  closingStyle?: string;
  formattingPreference?: string;

  // Signature elements (optional)
  bannedWords?: string[];
  signaturePhrases?: string[];

  // AI-generated (not user-edited)
  aiSummary?: string;
};

/**
 * Compile a StyleData profile into a prompt-ready text section.
 */
export function buildStyleContext(styleData: StyleData, styleName: string): string {
  const sections: string[] = [];

  sections.push(`## Writing Style: ${styleName}`);

  if (styleData.aiSummary?.trim()) {
    // Primary path: aiSummary is the sole voice signal
    sections.push(styleData.aiSummary);
  } else {
    // Fallback: no summary available, use structured fields
    sections.push(...buildStructuredFallback(styleData));
  }

  // Strategic context — always explicit (factual, not stylistic)
  const audience = formatStringOrArray(styleData.targetAudience);
  const identity = formatStringOrArray(styleData.professionalIdentity);
  const goal = formatStringOrArray(styleData.contentGoal);
  if (audience || identity || goal) {
    const lines: string[] = [];
    if (audience) {
      lines.push(`Audience: ${audience}`);
    }
    if (identity) {
      lines.push(`Author identity: ${identity}`);
    }
    if (goal) {
      lines.push(`Content goal: ${goal}`);
    }
    sections.push(`### Write for\n${lines.join('\n')}`);
  }

  // Signature elements — always explicit (concrete lists the summary can't capture verbatim)
  if (styleData.bannedWords && styleData.bannedWords.length > 0) {
    sections.push(`### Must Avoid\n${styleData.bannedWords.join(', ')}`);
  }
  if (styleData.signaturePhrases && styleData.signaturePhrases.length > 0) {
    sections.push(`### Signature Phrases (use naturally)\n${styleData.signaturePhrases.join(', ')}`);
  }

  return sections.join('\n\n');
}

/**
 * Build structured voice context from individual fields.
 * Used as fallback when aiSummary is not available.
 */
function buildStructuredFallback(styleData: StyleData): string[] {
  const sections: string[] = [];

  // Voice spectrum instructions (skip neutral and out-of-range)
  const spectrumLines: string[] = [];
  for (const key of VOICE_SPECTRUM_KEYS) {
    const entry = getSpectrumEntry(key, styleData[key]);
    if (entry?.instruction) {
      spectrumLines.push(`- ${entry.instruction}`);
    }
  }
  if (spectrumLines.length > 0) {
    sections.push(`### Voice Profile\n${spectrumLines.join('\n')}`);
  }

  // Guidelines (structured attributes)
  const guidelines: string[] = [];
  if (styleData.tone) {
    guidelines.push(`- Tone: ${styleData.tone}`);
  }
  if (styleData.jargonLevel) {
    guidelines.push(`- Jargon Level: ${formatEnum(styleData.jargonLevel)}`);
  }
  if (styleData.postLength) {
    guidelines.push(`- Length: ${formatEnum(styleData.postLength)}`);
  }
  if (styleData.openingStyle) {
    guidelines.push(`- Opening: ${formatEnum(styleData.openingStyle)}`);
  }
  if (styleData.closingStyle) {
    guidelines.push(`- Closing: ${formatEnum(styleData.closingStyle)}`);
  }
  if (styleData.formattingPreference) {
    guidelines.push(`- Formatting: ${formatEnum(styleData.formattingPreference)}`);
  }
  if (guidelines.length > 0) {
    sections.push(`### Guidelines\n${guidelines.join('\n')}`);
  }

  return sections;
}
