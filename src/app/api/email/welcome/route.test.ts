import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
const mockGetUser = vi.fn();
const mockSendWelcomeEmail = vi.fn();

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/libs/email', () => ({
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe('POST /api/email/welcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without authentication', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/email/welcome', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 200 on successful send', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
        },
      },
      error: null,
    });

    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_123',
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/email/welcome', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.messageId).toBe('msg_123');

    // Verify sendWelcomeEmail was called with correct args
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
    );
  });

  it('returns 500 on send failure', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    mockSendWelcomeEmail.mockResolvedValue({
      success: false,
      error: 'Failed to send email',
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/email/welcome', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to send email');
  });

  it('extracts name from full_name if name not present', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: 'oauth@example.com',
          user_metadata: { full_name: 'OAuth User' },
        },
      },
      error: null,
    });

    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_456',
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/email/welcome', {
      method: 'POST',
    });

    await POST(request);

    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      'oauth@example.com',
      'OAuth User',
    );
  });

  it('handles user without name gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          email: 'noname@example.com',
          user_metadata: {},
        },
      },
      error: null,
    });

    mockSendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: 'msg_789',
    });

    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/email/welcome', {
      method: 'POST',
    });

    await POST(request);

    // Should call with undefined name
    expect(mockSendWelcomeEmail).toHaveBeenCalledWith(
      'noname@example.com',
      undefined,
    );
  });
});
