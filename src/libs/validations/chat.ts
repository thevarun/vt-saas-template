/**
 * Shared chat validation constants.
 * Used across Dify and Vercel AI SDK chat routes.
 */

export const CHAT_MAX_MESSAGE_LENGTH = 10_000;

export const CONVERSATION_ID_PATTERN = /^[a-z0-9-]{1,128}$/i;
