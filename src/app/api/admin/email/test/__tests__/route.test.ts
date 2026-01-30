import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock supabase client
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('@/libs/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock isAdmin
const mockIsAdmin = vi.fn();
vi.mock('@/libs/auth/isAdmin', () => ({
  isAdmin: () => mockIsAdmin(),
}));

// Mock logApiError to avoid Sentry dependency in tests
vi.mock('@/libs/api/errors/logger', () => ({
  logApiError: vi.fn(),
  logAuthError: vi.fn(),
  logAuthzError: vi.fn(),
  logDbError: vi.fn(),
  logValidationError: vi.fn(),
}));

// Mock sendTestEmail
const mockSendTestEmail = vi.fn();
vi.mock('@/libs/email/mockEmailService', () => ({
  sendTestEmail: (...args: unknown[]) => mockSendTestEmail(...args),
}));

// Import route handler after mocks
const { POST } = await import('../route');

// Helper to create mock request
function createMockRequest(body?: Record<string, unknown>): NextRequest {
  return {
    json: body ? () => Promise.resolve(body) : () => Promise.reject(new Error('No body')),
  } as unknown as NextRequest;
}

const ADMIN_USER_ID = '11111111-1111-1111-1111-111111111111';

const mockAdminUser: User = {
  id: ADMIN_USER_ID,
  email: 'admin@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: { admin: true },
  user_metadata: {},
} as User;

describe('POST /api/admin/email/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated admin user
    mockGetUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });
    mockIsAdmin.mockReturnValue(true);
    mockSendTestEmail.mockResolvedValue({
      success: true,
      messageId: 'mock-123-welcome',
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const response = await POST(createMockRequest({
      template: 'welcome',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('AUTH_REQUIRED');
  });

  it('returns 403 when not admin', async () => {
    mockIsAdmin.mockReturnValue(false);

    const response = await POST(createMockRequest({
      template: 'welcome',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe('FORBIDDEN');
  });

  it('returns 400 for missing template', async () => {
    const response = await POST(createMockRequest({
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid email', async () => {
    const response = await POST(createMockRequest({
      template: 'welcome',
      email: 'not-an-email',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid template', async () => {
    const response = await POST(createMockRequest({
      template: 'invalid-template',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 with valid input', async () => {
    const response = await POST(createMockRequest({
      template: 'welcome',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageId).toBe('mock-123-welcome');
    expect(data.message).toBe('Test email would be sent to test@example.com in production');
  });

  it('returns 500 when email service fails', async () => {
    mockSendTestEmail.mockResolvedValue({
      success: false,
      error: 'Service unavailable',
    });

    const response = await POST(createMockRequest({
      template: 'welcome',
      email: 'test@example.com',
    }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Service unavailable');
  });
});
