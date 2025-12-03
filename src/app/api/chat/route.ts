import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createDifyClient } from '@/libs/dify/client';
import type { DifyChatRequest } from '@/libs/dify/types';
import { logger } from '@/libs/Logger';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/chat
 * Chat endpoint that validates Supabase session and proxies to Dify API
 *
 * Acceptance Criteria:
 * - AC #1: Validates Supabase session before proxying requests
 * - AC #2: Unauthorized requests return 401 with appropriate error message
 * - AC #3: Valid requests successfully proxy to Dify API
 * - AC #4: Streaming responses (SSE) work correctly from Dify through proxy to client
 * - AC #5: Dify API errors are caught and returned as appropriate HTTP responses
 * - AC #6: Dify API key is never exposed to client-side code (handled by server-side only)
 *
 * Rate Limiting Considerations (Future Work):
 * - Implement rate limiting per user (e.g., 60 requests/minute) using Upstash Redis or similar
 * - Consider implementing exponential backoff for Dify API errors
 * - Add request queuing during peak load to prevent overwhelming Dify API
 * - Monitor Dify API usage to stay within plan limits (track via middleware or separate service)
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // AC #1: Validate Supabase session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // AC #2: Return 401 for unauthorized requests
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Extract message and conversationId from request body
    const body = await request.json();
    const { message, conversationId } = body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required', code: 'INVALID_REQUEST' },
        { status: 400 },
      );
    }

    // Validate message size (max 10,000 characters)
    if (message.length > 10000) {
      return NextResponse.json(
        {
          error: 'Message exceeds maximum length of 10,000 characters',
          code: 'MESSAGE_TOO_LONG',
        },
        { status: 400 },
      );
    }

    // Validate conversation ID format if provided
    if (conversationId !== undefined && conversationId !== null) {
      if (typeof conversationId !== 'string') {
        return NextResponse.json(
          { error: 'Conversation ID must be a string', code: 'INVALID_REQUEST' },
          { status: 400 },
        );
      }

      // Validate format: alphanumeric + hyphens, max 128 chars
      const conversationIdPattern = /^[a-z0-9-]{1,128}$/i;
      if (!conversationIdPattern.test(conversationId)) {
        return NextResponse.json(
          {
            error:
              'Conversation ID must be alphanumeric with hyphens, max 128 characters',
            code: 'INVALID_CONVERSATION_ID',
          },
          { status: 400 },
        );
      }
    }

    // AC #3: Proxy request to Dify API
    const difyClient = createDifyClient();
    const difyRequest: DifyChatRequest = {
      query: message,
      user: user.id,
      response_mode: 'streaming',
      conversation_id: conversationId,
      inputs: {},
    };

    const stream = await difyClient.chatMessages(difyRequest);

    // AC #4: Stream SSE response back to client
    if (!(stream instanceof ReadableStream)) {
      // Should not happen for streaming mode, but handle gracefully
      return NextResponse.json(stream);
    }

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    // AC #5: Handle Dify API errors
    logger.error({ error }, 'Chat API error');

    // Handle Dify-specific errors
    if (error.status) {
      return NextResponse.json(
        {
          error: error.message || 'Dify API error',
          code: error.code || 'DIFY_ERROR',
        },
        { status: error.status },
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
