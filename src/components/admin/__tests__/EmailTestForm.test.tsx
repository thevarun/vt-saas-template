import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailTestForm } from '../EmailTestForm';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string, params?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'templateLabel': 'Email Template',
        'templatePlaceholder': 'Select a template',
        'templateDescription': 'Choose which email template to test.',
        'templates.welcome': 'Welcome Email',
        'templates.passwordReset': 'Password Reset',
        'templates.verifyEmail': 'Email Verification',
        'emailLabel': 'Recipient Email',
        'emailPlaceholder': 'recipient@example.com',
        'emailDescription': 'Enter a valid email address to receive the test email.',
        'dataLabel': 'Template Data (Optional)',
        'dataPlaceholder': '{"name": "John Doe"}',
        'dataDescription': 'Optional JSON data to populate template variables.',
        'sendButton': 'Send Test Email',
        'sendingButton': 'Sending...',
        'successTitle': 'Test Email Sent',
        'successMessage': `Test email successfully sent to ${params?.email || ''}.`,
        'errorTitle': 'Failed to Send',
        'invalidJson': 'Invalid JSON format in template data.',
      };
      return translations[key] || key;
    };
    return t;
  },
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock parseApiError
vi.mock('@/libs/api/client', () => ({
  parseApiError: vi.fn().mockResolvedValue({
    message: 'Server error occurred',
    code: 'INTERNAL_ERROR',
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('EmailTestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields with correct labels', () => {
    render(<EmailTestForm />);

    expect(screen.getByText('Email Template')).toBeInTheDocument();
    expect(screen.getByText('Recipient Email')).toBeInTheDocument();
    expect(screen.getByText('Template Data (Optional)')).toBeInTheDocument();
  });

  it('renders form field descriptions', () => {
    render(<EmailTestForm />);

    expect(screen.getByText('Choose which email template to test.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address to receive the test email.')).toBeInTheDocument();
    expect(screen.getByText('Optional JSON data to populate template variables.')).toBeInTheDocument();
  });

  it('renders submit button with correct default text', () => {
    render(<EmailTestForm />);

    const button = screen.getByTestId('submit-button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Send Test Email');
  });

  it('renders template select with placeholder', () => {
    render(<EmailTestForm />);

    expect(screen.getByTestId('template-select')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    render(<EmailTestForm />);

    const emailInput = screen.getByTestId('email-input');

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'recipient@example.com');
  });

  it('renders data textarea field', () => {
    render(<EmailTestForm />);

    const textarea = screen.getByTestId('data-textarea');

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', '{"name": "John Doe"}');
  });

  it('allows typing in the email input', async () => {
    const user = userEvent.setup();
    render(<EmailTestForm />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('allows typing in the data textarea', async () => {
    const user = userEvent.setup();
    render(<EmailTestForm />);

    const textarea = screen.getByTestId('data-textarea');
    await user.type(textarea, '{{"name": "Test"}');

    expect(textarea).toHaveValue('{"name": "Test"}');
  });

  it('shows success toast on successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Test email would be sent to test@example.com in production',
      }),
    });

    const user = userEvent.setup();
    render(<EmailTestForm />);

    // Fill in email
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/email/test', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Email Sent',
      }));
    });
  });

  it('shows error message on API failure', async () => {
    const { parseApiError } = await import('@/libs/api/client');
    (parseApiError as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      message: 'Admin access required',
      code: 'FORBIDDEN',
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Admin access required' }),
    });

    const user = userEvent.setup();
    render(<EmailTestForm />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Admin access required');
    });
  });

  it('sends correct payload with template, email, and data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const user = userEvent.setup();
    render(<EmailTestForm />);

    // Fill email
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'admin@example.com');

    // Fill JSON data
    const textarea = screen.getByTestId('data-textarea');
    await user.type(textarea, '{{"name":"Test"}');

    // Submit
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/email/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            template: 'welcome',
            email: 'admin@example.com',
            data: { name: 'Test' },
          }),
        }),
      );
    });
  });

  it('shows error for invalid JSON data', async () => {
    const user = userEvent.setup();
    render(<EmailTestForm />);

    // Fill email
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    // Fill invalid JSON
    const textarea = screen.getByTestId('data-textarea');
    await user.type(textarea, 'not valid json');

    // Submit
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid JSON format in template data.');
    });
  });

  it('does not show error message initially', () => {
    render(<EmailTestForm />);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
});
