/**
 * Mem0 Memory Integration Configuration
 *
 * Mem0 provides persistent memory across conversations, enabling the AI to remember
 * facts, preferences, and context about users.
 *
 * This feature is OPTIONAL and DISABLED BY DEFAULT for privacy reasons.
 * Set ENABLE_MEM0=true to activate memory extraction.
 *
 * Environment Variables:
 * - ENABLE_MEM0: Feature toggle (default: false)
 * - MEM0_API_KEY: API key from https://mem0.ai
 *
 * Privacy Considerations:
 * - Conversation content is sent to Mem0 API for analysis
 * - Memories are stored in Mem0's cloud (or self-hosted)
 * - Review Mem0 privacy policy before enabling
 *
 * @see {@link https://mem0.ai/docs Mem0 Documentation}
 */

export type Mem0Config = {
  enabled: boolean;
  apiKey?: string;
};

/**
 * Mem0 configuration loaded from environment variables
 *
 * The feature is disabled by default and requires explicit opt-in.
 * Both ENABLE_MEM0=true and a valid MEM0_API_KEY are required.
 */
export const MEM0_CONFIG: Mem0Config = {
  enabled: process.env.ENABLE_MEM0 === 'true',
  apiKey: process.env.MEM0_API_KEY,
};

/**
 * Check if Mem0 is properly configured and enabled
 *
 * @returns true if Mem0 is enabled AND has a valid API key
 */
export function isEnabled(): boolean {
  return MEM0_CONFIG.enabled && !!MEM0_CONFIG.apiKey;
}
