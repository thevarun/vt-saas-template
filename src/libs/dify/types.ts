/**
 * Dify API TypeScript Types
 * Based on Dify Chat Messages API v1
 */

export type DifyChatRequest = {
  query: string;
  user: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  inputs?: Record<string, unknown>;
};

export type DifyChatResponse = {
  event: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: DifyMetadata;
  created_at: number;
};

export type DifyMetadata = {
  annotation_reply: unknown;
  retriever_resources: unknown[];
  usage: DifyUsage;
};

export type DifyUsage = {
  prompt_tokens: number;
  prompt_unit_price: string;
  prompt_price_unit: string;
  prompt_price: string;
  completion_tokens: number;
  completion_unit_price: string;
  completion_price_unit: string;
  completion_price: string;
  total_tokens: number;
  total_price: string;
  currency: string;
  latency: number;
  time_to_first_token?: number;
  time_to_generate?: number;
};

export type DifyStreamEvent = {
  event: 'message' | 'message_end' | 'error' | 'ping';
  task_id?: string;
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  created_at?: number;
  metadata?: DifyMetadata;
  status?: number;
  code?: string;
  message?: string;
};

export type DifyError = {
  status: number;
  code: string;
  message: string;
};

// Message history types
export type DifyMessage = {
  id: string;
  conversation_id: string;
  inputs: Record<string, unknown>;
  query: string; // User message
  answer: string; // Assistant message
  message_files: unknown[];
  feedback: unknown;
  retriever_resources: unknown[];
  created_at: number;
  agent_thoughts: unknown[];
  message_metadata: unknown;
  status: string;
  error: string | null;
};

export type DifyMessagesResponse = {
  limit: number;
  has_more: boolean;
  data: DifyMessage[];
};
