import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the sendEmail module
const mockSendEmail = vi.fn();
vi.mock('./sendEmail', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// Mock environment variables
vi.stubEnv('EMAIL_FROM_NAME', 'Test App');
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://testapp.com');

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test_msg_123',
    });
  });

  it('calls sendEmail with correct subject', async () => {
    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    await sendWelcomeEmail('user@example.com');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringContaining('Welcome to'),
      expect.anything(), // React component
      expect.objectContaining({
        tags: expect.arrayContaining([
          expect.objectContaining({ name: 'type', value: 'welcome' }),
        ]),
      }),
    );
  });

  it('passes name to template when provided', async () => {
    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    await sendWelcomeEmail('user@example.com', 'John Doe');

    // Check that the react component is passed with recipientName
    const call = mockSendEmail.mock.calls[0];

    expect(call).toBeDefined();

    if (call) {
      // The third argument is the React element
      const reactElement = call[2] as { props: { recipientName?: string } };

      expect(reactElement.props.recipientName).toBe('John Doe');
    }
  });

  it('handles missing name gracefully', async () => {
    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    await sendWelcomeEmail('user@example.com');

    // Verify it still calls sendEmail without errors
    expect(mockSendEmail).toHaveBeenCalled();

    const call = mockSendEmail.mock.calls[0];

    expect(call).toBeDefined();

    if (call) {
      // Template should not have recipientName when not provided
      const reactElement = call[2] as { props: { recipientName?: string } };

      expect(reactElement.props.recipientName).toBeUndefined();
    }
  });

  it('includes welcome tag', async () => {
    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    await sendWelcomeEmail('user@example.com');

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.anything(),
      expect.objectContaining({
        tags: [{ name: 'type', value: 'welcome' }],
      }),
    );
  });

  it('returns success correctly', async () => {
    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    const result = await sendWelcomeEmail('user@example.com');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.messageId).toBe('test_msg_123');
    }
  });

  it('returns failure correctly', async () => {
    mockSendEmail.mockResolvedValue({
      success: false,
      error: 'Failed to send',
      code: 'SEND_ERROR',
    });

    const { sendWelcomeEmail } = await import('./sendWelcomeEmail.js');

    const result = await sendWelcomeEmail('user@example.com');

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error).toBe('Failed to send');
    }
  });
});
