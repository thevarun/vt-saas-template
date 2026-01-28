import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { sendWelcomeEmail } from '@/libs/email';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/email/welcome
 *
 * Send a welcome email to the authenticated user.
 * Requires valid session (authenticated user).
 *
 * @returns {Promise<NextResponse>} Success or error response
 */
export async function POST(_request: Request) {
  try {
    // Verify the request is authenticated
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Extract user name from metadata (supports both 'name' and 'full_name')
    const userName = user.user_metadata?.name || user.user_metadata?.full_name;

    // Send welcome email
    const result = await sendWelcomeEmail(
      user.email,
      userName,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
