# Story 6.7: Email Testing UI

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want a visual interface to test email templates,
so that I can verify email delivery and rendering in production.

## Acceptance Criteria

### AC1: Email Testing Page UI
**Given** I am on the admin email testing page
**When** the page loads
**Then** I see a dropdown of available email templates
**And** I see an input for recipient email address
**And** I see template-specific data fields (if applicable)

### AC2: Send Test Email
**Given** I select a template and enter an email
**When** I click "Send Test Email"
**Then** the email is sent via mock email service (stub for future Resend integration)
**And** I see success confirmation with send status
**And** I receive confirmation that email would be sent in production

### AC3: Error Handling
**Given** the email send fails
**When** the mock service returns an error
**Then** I see the error message clearly displayed
**And** I can retry the send

### AC4: Admin Access Control
**Given** the email testing page
**When** I review security
**Then** page is only accessible to admins
**And** protected by the same middleware as other admin routes

### AC5: API Route Implementation
**Given** the email testing implementation
**When** I review the code
**Then** API route is at `/api/admin/email/test`
**And** route validates admin session before processing
**And** route accepts `{ template: string, email: string, data?: object }`
**And** route uses mock/stub email service (not actual Resend)

## Tasks / Subtasks

- [ ] Task 1: Create mock email service stub (AC: #2, #5)
  - [ ] Subtask 1.1: Create `src/libs/email/mockEmailService.ts`
  - [ ] Subtask 1.2: Define EmailTemplate type ('welcome', 'password-reset', 'verify-email')
  - [ ] Subtask 1.3: Define SendEmailParams interface (template, to, data?)
  - [ ] Subtask 1.4: Implement sendTestEmail() function that simulates email sending
  - [ ] Subtask 1.5: Add random success/failure simulation (90% success rate) for testing
  - [ ] Subtask 1.6: Return result with { success: boolean, messageId?: string, error?: string }
  - [ ] Subtask 1.7: Add console.log to show what would be sent
  - [ ] Subtask 1.8: Add TODO comment for future Resend integration

- [ ] Task 2: Create email test API route (AC: #2, #3, #4, #5)
  - [ ] Subtask 2.1: Create `src/app/api/admin/email/test/route.ts`
  - [ ] Subtask 2.2: Import authentication utilities (createClient, isAdmin)
  - [ ] Subtask 2.3: Import error utilities from @/libs/api/errors
  - [ ] Subtask 2.4: Verify admin session first (pattern from Story 6.4)
  - [ ] Subtask 2.5: Check isAdmin() - return forbiddenError if not admin
  - [ ] Subtask 2.6: Define Zod schema for request body (template, email, data?)
  - [ ] Subtask 2.7: Validate request body with Zod - return validationError if invalid
  - [ ] Subtask 2.8: Call mockEmailService.sendTestEmail()
  - [ ] Subtask 2.9: Return success response with messageId on success
  - [ ] Subtask 2.10: Return internalError with error message on failure
  - [ ] Subtask 2.11: Add proper TypeScript types for all parameters

- [ ] Task 3: Create email testing page (AC: #1, #4)
  - [ ] Subtask 3.1: Create `src/app/[locale]/(auth)/admin/email/page.tsx`
  - [ ] Subtask 3.2: Mark as async Server Component
  - [ ] Subtask 3.3: Extract locale from params (await props.params)
  - [ ] Subtask 3.4: Fetch translations with getTranslations()
  - [ ] Subtask 3.5: Add page title and description
  - [ ] Subtask 3.6: Render EmailTestForm client component
  - [ ] Subtask 3.7: Wrap in Card component for consistent styling

- [ ] Task 4: Create EmailTestForm client component (AC: #1, #2, #3)
  - [ ] Subtask 4.1: Create `src/components/admin/EmailTestForm.tsx` as "use client"
  - [ ] Subtask 4.2: Use React Hook Form with Zod validation
  - [ ] Subtask 4.3: Define form schema (template, email, data?)
  - [ ] Subtask 4.4: Add Select component for template dropdown
  - [ ] Subtask 4.5: Add options: Welcome Email, Password Reset, Email Verification
  - [ ] Subtask 4.6: Add Input component for recipient email
  - [ ] Subtask 4.7: Add email validation (Zod email schema)
  - [ ] Subtask 4.8: Add Textarea for template data (JSON format, optional)
  - [ ] Subtask 4.9: Add JSON validation for data field (try/catch parse)
  - [ ] Subtask 4.10: Add "Send Test Email" Button (primary variant)
  - [ ] Subtask 4.11: Show loading state during send (disable button)
  - [ ] Subtask 4.12: Display success toast on successful send
  - [ ] Subtask 4.13: Display error message below form on failure
  - [ ] Subtask 4.14: Add "Try Again" option after error
  - [ ] Subtask 4.15: Reset form after successful send

- [ ] Task 5: Add email testing navigation (AC: #4)
  - [ ] Subtask 5.1: Update `src/components/admin/AdminSidebar.tsx` (if exists)
  - [ ] Subtask 5.2: Add "Email Testing" nav item to System section
  - [ ] Subtask 5.3: Use Mail icon from Lucide
  - [ ] Subtask 5.4: Link to `/admin/email` route
  - [ ] Subtask 5.5: Add active state styling when on email testing page
  - [ ] Subtask 5.6: Verify mobile navigation includes email testing link

- [ ] Task 6: Add i18n translations (AC: #1, #2, #3)
  - [ ] Subtask 6.1: Add email testing translations to `src/locales/en.json`
  - [ ] Subtask 6.2: Add page title, description, form labels
  - [ ] Subtask 6.3: Add template options (Welcome, Password Reset, Verification)
  - [ ] Subtask 6.4: Add success/error messages
  - [ ] Subtask 6.5: Add button labels and helper text
  - [ ] Subtask 6.6: Duplicate translations for Hindi (`src/locales/hi.json`)
  - [ ] Subtask 6.7: Duplicate translations for Bengali (`src/locales/bn.json`)
  - [ ] Subtask 6.8: Use `useTranslations('Admin.Email')` in components
  - [ ] Subtask 6.9: Use `await getTranslations({ locale, namespace })` in server pages

- [ ] Task 7: Write mock email service tests (AC: #2, #5)
  - [ ] Subtask 7.1: Create `src/libs/email/mockEmailService.test.ts`
  - [ ] Subtask 7.2: Test sendTestEmail returns success on valid input
  - [ ] Subtask 7.3: Test sendTestEmail includes messageId on success
  - [ ] Subtask 7.4: Test sendTestEmail can return errors (random failures)
  - [ ] Subtask 7.5: Test all template types are supported
  - [ ] Subtask 7.6: Test data parameter is optional
  - [ ] Subtask 7.7: Mock console.log to verify output

- [ ] Task 8: Write API route tests (AC: #4, #5)
  - [ ] Subtask 8.1: Create `src/app/api/admin/email/test/__tests__/route.test.ts`
  - [ ] Subtask 8.2: Test route requires authentication
  - [ ] Subtask 8.3: Test route requires admin role
  - [ ] Subtask 8.4: Test route validates request body schema
  - [ ] Subtask 8.5: Test route rejects invalid email format
  - [ ] Subtask 8.6: Test route rejects invalid template name
  - [ ] Subtask 8.7: Test route returns success with valid input
  - [ ] Subtask 8.8: Test route returns error when mock service fails
  - [ ] Subtask 8.9: Mock Supabase client for authentication
  - [ ] Subtask 8.10: Mock mockEmailService for send testing

- [ ] Task 9: Write component tests (AC: #1, #2, #3)
  - [ ] Subtask 9.1: Create `src/components/admin/EmailTestForm.test.tsx`
  - [ ] Subtask 9.2: Test form renders all fields
  - [ ] Subtask 9.3: Test template dropdown has all options
  - [ ] Subtask 9.4: Test email validation (valid/invalid emails)
  - [ ] Subtask 9.5: Test JSON data validation (optional field)
  - [ ] Subtask 9.6: Test submit button disabled during send
  - [ ] Subtask 9.7: Test success toast displayed on success
  - [ ] Subtask 9.8: Test error message displayed on failure
  - [ ] Subtask 9.9: Test form resets after successful send
  - [ ] Subtask 9.10: Mock API route fetch calls

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The email testing UI is already designed in SuperDesign prototype with complete HTML/CSS implementation.

| Screen/Component | Design Tool | Location | Files to Extract |
|------------------|-------------|----------|------------------|
| Email Testing Form | SuperDesign | `.superdesign/design_iterations/admin_email_1.html` | Form layout, dropdown, inputs |

**Design Documentation:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-6-admin-component-strategy.md`

**Adaptation Checklist:**
- [ ] Extract email testing form structure from `admin_email_1.html`
- [ ] Convert CSS classes to Tailwind utility classes
- [ ] Replace custom form elements with shadcn components
- [ ] Use shadcn Select for template dropdown
- [ ] Use shadcn Input for email field
- [ ] Use shadcn Textarea for optional data field
- [ ] Use shadcn Button for submit action
- [ ] Add proper form validation with React Hook Form + Zod
- [ ] Wire up to mock email service API route
- [ ] Add loading states and error handling
- [ ] Test dark mode appearance
- [ ] Add success/error toast notifications

**shadcn Components to Install:**
```bash
npx shadcn@latest add select textarea toast
```

**Key Design Tokens from Prototype:**
- Form field spacing: 24px (gap-6)
- Label font size: 14px (text-sm)
- Input padding: 12px (p-3)
- Button size: Large (h-12)
- Card max width: 600px
- Helper text: 12px muted (text-xs text-muted-foreground)

### Critical Architecture Requirements

**IMPORTANT CONTEXT:**
- This project does NOT yet have Resend integrated (Epic 4 is backlog)
- Email testing UI should be built with a mock/stub email service
- The stub can be swapped for Resend later without changing the UI
- Focus on building the UI and API route structure correctly

**Mock Email Service Pattern:**

```typescript
// src/libs/email/mockEmailService.ts
export type EmailTemplate = 'welcome' | 'password-reset' | 'verify-email';

export interface SendEmailParams {
  template: EmailTemplate;
  to: string;
  data?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendTestEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // Simulate email sending
  console.log('📧 Mock Email Service - Would send:', {
    template: params.template,
    to: params.to,
    data: params.data,
  });

  // Simulate success/failure (90% success rate)
  const shouldSucceed = Math.random() > 0.1;

  if (shouldSucceed) {
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  return {
    success: false,
    error: 'Mock email service simulated failure',
  };
}

// TODO: Replace with Resend integration in Epic 4
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);
```

**API Route Pattern:**

```typescript
// src/app/api/admin/email/test/route.ts
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

const TestEmailSchema = z.object({
  template: z.enum(['welcome', 'password-reset', 'verify-email']),
  email: z.string().email('Invalid email address'),
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

    // 2. Validate request body
    const body = await request.json();
    const validatedData = TestEmailSchema.safeParse(body);

    if (!validatedData.success) {
      return validationError(validatedData.error.message);
    }

    // 3. Send test email via mock service
    const result = await sendTestEmail({
      template: validatedData.data.template,
      to: validatedData.data.email,
      data: validatedData.data.data,
    });

    if (!result.success) {
      return internalError(result.error || 'Failed to send test email');
    }

    // 4. Return success
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email would be sent to ${validatedData.data.email} in production`,
    });
  } catch (error) {
    console.error('Email test error:', error);
    return internalError();
  }
}
```

**Page Implementation (Server Component):**

```typescript
// src/app/[locale]/(auth)/admin/email/page.tsx
import { getTranslations } from 'next-intl/server';

import { EmailTestForm } from '@/components/admin/EmailTestForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function EmailTestingPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Admin.Email' });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('description')}</p>
      </div>

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>{t('testEmail')}</CardTitle>
          <CardDescription>{t('testEmailDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTestForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

**EmailTestForm Component:**

```typescript
// src/components/admin/EmailTestForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const emailFormSchema = z.object({
  template: z.enum(['welcome', 'password-reset', 'verify-email']),
  email: z.string().email('Invalid email address'),
  data: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export function EmailTestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      template: 'welcome',
      email: '',
      data: '',
    },
  });

  async function onSubmit(values: EmailFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Parse data field as JSON if provided
      let parsedData: Record<string, unknown> | undefined;
      if (values.data && values.data.trim()) {
        try {
          parsedData = JSON.parse(values.data);
        } catch {
          setError('Invalid JSON in data field');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: values.template,
          email: values.email,
          data: parsedData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      toast({
        title: 'Email sent successfully',
        description: result.message,
      });

      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='template'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Template</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a template' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='welcome'>Welcome Email</SelectItem>
                  <SelectItem value='password-reset'>Password Reset</SelectItem>
                  <SelectItem value='verify-email'>Email Verification</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose which email template to test
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='test@example.com'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The email address to send the test to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='data'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Data (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"name": "John", "verificationUrl": "https://..."}'
                  className='font-mono text-sm'
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                JSON object with template-specific variables
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
            {error}
          </div>
        )}

        <Button type='submit' disabled={isLoading} className='w-full'>
          {isLoading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </form>
    </Form>
  );
}
```

### Implementation Strategy

**Phase 1: Mock Email Service**

1. Create `src/libs/email/mockEmailService.ts`
2. Implement sendTestEmail function with console logging
3. Add random success/failure simulation for testing
4. Write unit tests for mock service

**Phase 2: API Route**

1. Create `/api/admin/email/test` route
2. Add admin authentication checks (pattern from Story 6.4)
3. Add Zod validation for request body
4. Integrate mock email service
5. Write API route tests

**Phase 3: UI Components**

1. Create email testing page at `/admin/email`
2. Create EmailTestForm client component
3. Install shadcn components (Select, Textarea, Toast)
4. Wire up form to API route
5. Add success/error feedback
6. Write component tests

**Phase 4: Navigation & Translations**

1. Add email testing link to AdminSidebar
2. Add translations to all locale files
3. Test all form validation
4. Test error handling

### Testing Strategy

**Mock Email Service Tests:**

```typescript
// src/libs/email/mockEmailService.test.ts
import { describe, expect, it, vi } from 'vitest';
import { sendTestEmail } from './mockEmailService';

describe('mockEmailService', () => {
  it('returns success with messageId', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
    });

    if (result.success) {
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^mock-/);
    } else {
      // Random failure - expected occasionally
      expect(result.error).toBeDefined();
    }
  });

  it('accepts all template types', async () => {
    const templates = ['welcome', 'password-reset', 'verify-email'] as const;

    for (const template of templates) {
      const result = await sendTestEmail({
        template,
        to: 'test@example.com',
      });

      expect(result).toBeDefined();
    }
  });

  it('accepts optional data parameter', async () => {
    const result = await sendTestEmail({
      template: 'welcome',
      to: 'test@example.com',
      data: { name: 'John', url: 'https://example.com' },
    });

    expect(result).toBeDefined();
  });
});
```

**API Route Tests:**

```typescript
// src/app/api/admin/email/test/__tests__/route.test.ts
import { describe, expect, it, vi } from 'vitest';
import { POST } from '../route';

vi.mock('@/libs/supabase/server');
vi.mock('@/libs/email/mockEmailService');

describe('POST /api/admin/email/test', () => {
  it('requires authentication', async () => {
    // Mock unauthenticated request
    const response = await POST(mockRequest);
    expect(response.status).toBe(401);
  });

  it('requires admin role', async () => {
    // Mock authenticated non-admin user
    const response = await POST(mockRequest);
    expect(response.status).toBe(403);
  });

  it('validates request body', async () => {
    // Mock authenticated admin with invalid body
    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('sends test email with valid input', async () => {
    // Mock authenticated admin with valid body
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.messageId).toBeDefined();
  });
});
```

**Component Tests:**

```typescript
// src/components/admin/EmailTestForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmailTestForm } from './EmailTestForm';

describe('EmailTestForm', () => {
  it('renders all form fields', () => {
    render(<EmailTestForm />);

    expect(screen.getByLabelText(/email template/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/template data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send test email/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<EmailTestForm />);

    const emailInput = screen.getByLabelText(/recipient email/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('shows success toast on successful send', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'mock-123' }),
    });

    const user = userEvent.setup();
    render(<EmailTestForm />);

    await user.type(screen.getByLabelText(/recipient email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/email sent successfully/i)).toBeInTheDocument();
    });
  });
});
```

### Project Structure Notes

**New Files:**
```
src/
  libs/
    email/
      mockEmailService.ts           # Mock email service stub
      mockEmailService.test.ts      # Service tests
  app/
    api/admin/email/
      test/
        route.ts                    # Email test API route
        __tests__/
          route.test.ts             # API route tests
    [locale]/(auth)/admin/
      email/
        page.tsx                    # Email testing page
  components/admin/
    EmailTestForm.tsx               # Email test form component
    EmailTestForm.test.tsx          # Form tests
```

**Updated Files:**
```
src/
  components/admin/
    AdminSidebar.tsx                # Add email testing nav link
  locales/
    en.json                         # Email testing translations
    hi.json                         # Hindi translations
    bn.json                         # Bengali translations
```

**Import Patterns:**
```typescript
import { sendTestEmail } from '@/libs/email/mockEmailService';
import { EmailTestForm } from '@/components/admin/EmailTestForm';
import { isAdmin } from '@/libs/auth/isAdmin';
```

**Dependencies:**
- shadcn Select component (install if not present)
- shadcn Textarea component (install if not present)
- shadcn Toast component (already installed)
- React Hook Form (already installed)
- Zod (already installed)

### Previous Story Intelligence

**Learnings from Story 6.6 (Admin Audit Logging):**

1. **Admin API Pattern:**
   - All admin routes require authentication AND admin check
   - Pattern: `const supabase = createClient(cookieStore)` + `isAdmin(user)`
   - Return `unauthorizedError()` if not authenticated
   - Return `forbiddenError('Admin access required')` if not admin

2. **Error Handling Pattern:**
   - Import from `@/libs/api/errors` (unauthorizedError, forbiddenError, validationError, internalError)
   - Consistent error format across all admin routes
   - Use try-catch with fallback to internalError()

3. **Zod Validation Pattern:**
   - Define schema at route file level
   - Use `safeParse()` for validation
   - Return `validationError()` with error message if invalid

4. **Server Component Pattern:**
   - Async Server Components for pages
   - Client Components for interactive forms
   - Pass translations from server to client via props or hook

5. **Navigation Pattern:**
   - Add nav items to AdminSidebar in System section
   - Use Lucide icons (Mail for email testing)
   - Active state based on pathname

### Security Considerations

**Access Control:**
- Email testing page protected by middleware (Story 6.1)
- Only admins can access `/admin/email` route
- API route validates admin session server-side only
- No client-side access to email service

**Input Validation:**
- Email address validated with Zod email schema
- Template name validated against enum (whitelist)
- Optional data validated as JSON object
- All inputs sanitized before processing

**Mock Service Pattern:**
- No actual emails sent in this implementation
- Console logs show what would be sent
- Ready for Resend integration in Epic 4
- No API keys or secrets exposed

**Error Handling:**
- Generic error messages to client (no internal details)
- Detailed errors logged server-side only
- No sensitive data in error responses
- Graceful degradation on service failures

### References

- [Source: Epic 6 Story 6.7] - Full acceptance criteria
- [Source: _bmad-output/planning-artifacts/ux-design/epic-6-admin-design-brief.md] - Visual design system
- [Source: .superdesign/design_iterations/admin_email_1.html] - Email testing prototype
- [Source: Story 6.1] - Admin access control and middleware
- [Source: Story 6.2] - Admin layout and navigation
- [Source: Story 6.4] - Admin API route patterns (suspend, reset-password)
- [Source: Story 6.6] - Admin API error handling patterns
- [Source: src/app/api/admin/users/[userId]/suspend/route.ts] - Admin API implementation example
- [Source: CLAUDE.md#API Error Handling] - Error response patterns
- [Source: PRD#FR-ADMIN-007] - Email testing requirements
- [Source: Epic 4] - Future Resend integration (backlog)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

---

## Desk Check

**Status:** pending
**Date:**
**Full Report:**

### Verification Summary
