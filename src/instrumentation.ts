import * as Sentry from '@sentry/nextjs';

/**
 * Next.js instrumentation hook
 *
 * Called when the Next.js app starts up. Used for:
 * - Sentry initialization (error tracking)
 * - LangFuse OpenTelemetry setup (LLM tracing)
 *
 * LangFuse integration uses OpenTelemetry to automatically capture:
 * - All Vercel AI SDK streamText/generateText calls
 * - Input messages and output completions
 * - Token usage and latency metrics
 * - Model metadata
 *
 * Graceful Degradation:
 * - If LangFuse is not configured, tracing is skipped
 * - Chat functionality works normally without LangFuse
 * - Warning logged once per app lifecycle
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation}
 * @see {@link https://langfuse.com/docs/integrations/vercel-ai-sdk}
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize LangFuse OpenTelemetry tracing (if configured)
    // Must be done BEFORE Sentry to ensure proper trace context
    await initializeLangfuseTracing();

    // Node.js Sentry configuration
    Sentry.init({
      // Sentry DSN
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Enable Spotlight in development
      spotlight: process.env.NODE_ENV === 'development',

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,

      // Prevent Sentry from claiming the global OpenTelemetry TracerProvider.
      // Without this, Sentry.init owns the provider and the LangFuse exporter
      // registered above silently receives no spans — forks with LangFuse keys
      // would get zero AI traces.
      skipOpenTelemetrySetup: true,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge Sentry configuration
    Sentry.init({
      // Sentry DSN
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Enable Spotlight in development
      spotlight: process.env.NODE_ENV === 'development',

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: 1,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: false,
    });
  }
}

/**
 * Forward unhandled errors from Route Handlers, Server Components, and Server
 * Actions to Sentry. Without this hook those server-side errors never reach the
 * SDK — Next.js just returns an opaque 500 with no Sentry issue.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#capture-react-render-errors
 */
export const onRequestError = Sentry.captureRequestError;

/**
 * Initialize LangFuse OpenTelemetry tracing
 *
 * Uses @vercel/otel with LangfuseExporter for simplified setup.
 * This enables automatic tracing of Vercel AI SDK calls.
 */
async function initializeLangfuseTracing() {
  try {
    // Dynamic import to avoid loading LangFuse in edge runtime
    const { registerOTel } = await import('@vercel/otel');
    const { LangfuseExporter } = await import('langfuse-vercel');
    const { isConfigured, LANGFUSE_CONFIG }
      = await import('@/libs/langfuse/config');

    // Skip if not configured (graceful degradation)
    if (!isConfigured()) {
      return;
    }

    // Register OpenTelemetry with LangFuse exporter
    registerOTel({
      serviceName: 'vt-saas-template-chat',
      traceExporter: new LangfuseExporter({
        publicKey: LANGFUSE_CONFIG.publicKey,
        secretKey: LANGFUSE_CONFIG.secretKey,
        baseUrl: LANGFUSE_CONFIG.host,
      }),
    });

    // Log success (getLangfuseClient will log the success message)
  } catch (error) {
    // Gracefully handle initialization errors
    // Don't throw - chat should work without tracing
    // Use console.error instead of logger to avoid importing Node-only modules during build

    console.error('Failed to initialize LangFuse tracing:', error);
  }
}
