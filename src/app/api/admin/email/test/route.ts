import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  internalError,
  invalidRequestError,
  logApiError,
  validationError,
} from '@/libs/api/errors';
import { withAdminAuth } from '@/libs/api/middleware';
import { sendTestEmail } from '@/libs/email/mockEmailService';

const TestEmailSchema = z.object({
  template: z.enum(['welcome', 'password-reset', 'verify-email']),
  email: z.string().email(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withAdminAuth(async (request) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return invalidRequestError('Invalid JSON in request body');
    }

    const parsed = TestEmailSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.message);
    }

    const result = await sendTestEmail({
      template: parsed.data.template,
      to: parsed.data.email,
      data: parsed.data.data,
    });

    if (!result.success) {
      logApiError(result.error || new Error('Unknown test email failure'), {
        endpoint: '/api/admin/email/test',
        method: 'POST',
        metadata: { template: parsed.data.template },
      });
      return internalError('Failed to send test email');
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email would be sent to ${parsed.data.email} in production`,
    });
  } catch (error) {
    logApiError(error, {
      endpoint: '/api/admin/email/test',
      method: 'POST',
    });
    return internalError();
  }
});
