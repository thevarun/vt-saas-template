import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { internalError, logApiError, unauthorizedError } from '@/libs/api/errors';
import { sendWelcomeEmail } from '@/libs/email';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/email/welcome
 *
 * Send a welcome email to the authenticated user.
 * Requires valid session (authenticated user).
 */
export async function POST(_request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return unauthorizedError();
    }

    const userName = user.user_metadata?.name || user.user_metadata?.full_name;

    const result = await sendWelcomeEmail(
      user.email,
      userName,
    );

    if (!result.success) {
      logApiError(result.error || new Error('Unknown email send failure'), {
        endpoint: '/api/email/welcome',
        method: 'POST',
        userId: user.id,
        metadata: { operation: 'send_welcome_email' },
      });
      return internalError('Failed to send email');
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/email/welcome',
      method: 'POST',
    });
    return internalError();
  }
}
