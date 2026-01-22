import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/libs/supabase/client';

import UserProfilePage from './page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/libs/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('UserProfilePage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      admin: {
        listUsers: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  };

  const mockTranslations = {
    title: 'User Profile',
    description: 'Manage your account information',
    email_label: 'Email Address',
    email_readonly_hint: 'Email cannot be changed',
    username_label: 'Username',
    username_placeholder: 'Enter your username',
    username_hint: '3-20 characters, letters, numbers, and underscores only',
    username_available: 'Username is available',
    username_taken: 'Username is already taken',
    display_name_label: 'Display Name',
    display_name_placeholder: 'Enter your display name',
    save_button: 'Save Changes',
    saving: 'Saving...',
    success_title: 'Profile Updated',
    success_message: 'Your profile has been updated successfully',
    error_title: 'Error',
    error_message: 'Failed to update profile',
    error_username_taken: 'This username is already taken',
    validation_username_min: 'Username must be at least 3 characters',
    validation_username_max: 'Username must be at most 20 characters',
    validation_username_format: 'Username can only contain letters, numbers, and underscores',
    validation_display_name_required: 'Display name is required',
    validation_display_name_max: 'Display name must be at most 50 characters',
    danger_zone_title: 'Danger Zone',
    danger_zone_description: 'Irreversible and destructive actions',
    delete_account_title: 'Delete Account',
    delete_account_description: 'Permanently delete your account',
    delete_button: 'Delete Account',
    delete_dialog_title: 'Delete Account?',
    delete_dialog_message: 'This action cannot be undone',
    cancel_button: 'Cancel',
    confirm_delete_button: 'Yes, Delete Account',
    deleting: 'Deleting...',
    delete_success_title: 'Account Deleted',
    delete_success_message: 'Your account has been permanently deleted',
    delete_error_message: 'Failed to delete account',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ locale: 'en' });
    (useTranslations as any).mockReturnValue((key: string) => mockTranslations[key as keyof typeof mockTranslations] || key);
    (createClient as any).mockReturnValue(mockSupabase);

    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            username: 'testuser',
            display_name: 'Test User',
          },
        },
      },
      error: null,
    });

    // Mock fetch for API calls
    globalThis.fetch = vi.fn();
  });

  it('should render profile form with user data', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toHaveValue('test@example.com');
      expect(screen.getByLabelText('Username')).toHaveValue('testuser');
      expect(screen.getByLabelText('Display Name')).toHaveValue('Test User');
    });
  });

  it('should display email as read-only', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      const emailInput = screen.getByLabelText('Email Address');

      expect(emailInput).toBeDisabled();
    });
  });

  it('should validate username format', async () => {
    const user = userEvent.setup();
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText('Username');

    // Clear and enter invalid username
    await user.clear(usernameInput);
    await user.type(usernameInput, 'ab');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('should check username availability when typing', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText('Username');

    await user.clear(usernameInput);
    await user.type(usernameInput, 'newusername');

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/profile/check-username',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'newusername' }),
        }),
      );
    });
  });

  it('should show delete confirmation dialog when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete account/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Account?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByLabelText('Display Name');

    // Clear display name
    await user.clear(displayNameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
  });

  it('should handle loading state on mount', () => {
    mockSupabase.auth.getUser.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {},
          },
        },
        error: null,
      }), 100)),
    );

    const { container } = render(<UserProfilePage />);

    // Should show loading container with spinner
    const loadingDiv = container.querySelector('.animate-spin');

    expect(loadingDiv).toBeInTheDocument();
  });
});
