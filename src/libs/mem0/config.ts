/** @module Mem0 configuration -- optional, disabled by default. Requires ENABLE_MEM0=true and MEM0_API_KEY. */

export type Mem0Config = {
  enabled: boolean;
  apiKey?: string;
};

export const MEM0_CONFIG: Mem0Config = {
  enabled: process.env.ENABLE_MEM0 === 'true',
  apiKey: process.env.MEM0_API_KEY,
};

/** Returns true if Mem0 is enabled AND has a valid API key. */
export function isEnabled(): boolean {
  return MEM0_CONFIG.enabled && !!MEM0_CONFIG.apiKey;
}
