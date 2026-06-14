import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const Env = createEnv({
  server: {
    DB_SCHEMA: z.string().min(1),
    DATABASE_URL: z.string().optional(),
    LOGTAIL_SOURCE_TOKEN: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    // Dify (AI chat) - Optional to allow graceful degradation
    DIFY_API_KEY: z.string().optional(),
    DIFY_API_URL: z.string().url().optional(),
    // Vercel AI SDK - Optional to allow graceful degradation
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
    DEFAULT_AI_MODEL: z.string().default('gpt-4o-mini'),
    // Email (Resend)
    RESEND_API_KEY: z.string().optional(), // Optional for dev mode (console logging)
    EMAIL_FROM_ADDRESS: z.string().email().default('noreply@example.com'),
    EMAIL_FROM_NAME: z.string().default('VT SaaS Template'),
    EMAIL_REPLY_TO: z.string().email().optional(),
    // LangFuse (LLM observability) - Optional to allow graceful degradation
    LANGFUSE_PUBLIC_KEY: z.string().optional(),
    LANGFUSE_SECRET_KEY: z.string().optional(),
    LANGFUSE_HOST: z.string().url().default('https://cloud.langfuse.com'),
    LANGFUSE_TRACING_ENVIRONMENT: z.string().optional(),
    // Web search (provider-agnostic via src/libs/search) - Optional, graceful degradation
    SEARCH_PROVIDER: z.enum(['tavily', 'perplexity']).default('tavily'),
    TAVILY_API_KEY: z.string().optional(),
    PERPLEXITY_API_KEY: z.string().optional(),
    // Token encryption (AES-256-GCM) for secrets at rest, e.g. OAuth tokens.
    // 32-byte key as 64 hex chars: `openssl rand -hex 32`.
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
    // Mem0 (Memory Integration) - Optional to allow graceful degradation
    ENABLE_MEM0: z.enum(['true', 'false']).default('false'),
    MEM0_API_KEY: z.string().optional(),
    // Cron endpoint authentication
    CRON_SECRET: z.string().optional(),
    // Inbound webhook authentication (timing-safe X-Webhook-Secret guard)
    WEBHOOK_SECRET: z.string().min(16).optional(),
    // Inngest (background jobs / scheduled crons) — optional in local dev
    // (the Inngest Dev Server works without these keys).
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    DB_SCHEMA: process.env.DB_SCHEMA,
    DATABASE_URL: process.env.DATABASE_URL,
    LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DIFY_API_KEY: process.env.DIFY_API_KEY,
    DIFY_API_URL: process.env.DIFY_API_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    DEFAULT_AI_MODEL: process.env.DEFAULT_AI_MODEL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_HOST: process.env.LANGFUSE_HOST,
    LANGFUSE_TRACING_ENVIRONMENT: process.env.LANGFUSE_TRACING_ENVIRONMENT,
    SEARCH_PROVIDER: process.env.SEARCH_PROVIDER,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
    ENABLE_MEM0: process.env.ENABLE_MEM0,
    MEM0_API_KEY: process.env.MEM0_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
});
