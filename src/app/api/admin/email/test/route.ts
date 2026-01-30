import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  forbiddenError,
  internalError,
  unauthorizedError,
  validationError,
} from '@/libs/api/errors';
import { isAdmin } from '@/libs/auth/isAdmin';
import { sendTestEmail } from '@/libs/email/mockEmailService';
import { createClient } from '@/libs/supabase/server';

// Zod schema for validation
const TestEmailSchema = z.object({
  template: z.enum(['welcome', 'password-reset', 'verify-email']),
  email: z.string().email(),
  data: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin session
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorizedError();
    }
    if (!isAdmin(user)) {
      return forbiddenError('Admin access required');
    }

    // 2. Validate body
    const body = await request.json();
    const parsed = TestEmailSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.message);
    }

    // 3. Send test email
    const result = await sendTestEmail({
      template: parsed.data.template,
      to: parsed.data.email,
      data: parsed.data.data,
    });

    if (!result.success) {
      return internalError(result.error || 'Failed to send test email');
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email would be sent to ${parsed.data.email} in production`,
    });
  } catch (error) {
    console.error('Email test error:', error);
    return internalError();
  }
}
