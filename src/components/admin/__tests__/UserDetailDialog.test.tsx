import type { User } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserDetailDialog } from '../UserDetailDialog';

// Suppress radix-ui Dialog warning about aria-describedby
let originalWarn: typeof console.warn;

beforeAll(() => {
  originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Missing `Description`')) {
      return;
    }
    originalWarn(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      let result = key;
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
      return result;
    }
    return key;
  },
}));

// Mock child dialogs
vi.mock('../SuspendUserDialog', () => ({
  SuspendUserDialog: vi.fn(() => null),
}));

vi.mock('../DeleteUserDialog', () => ({
  DeleteUserDialog: vi.fn(() => null),
}));

vi.mock('../ResetPasswordDialog', () => ({
  ResetPasswordDialog: vi.fn(() => null),
}));

// Create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  last_sign_in_at: '2024-01-20T00:00:00Z',
  email_confirmed_at: '2024-01-15T01:00:00Z',
  phone: null,
  confirmed_at: '2024-01-15T01:00:00Z',
  app_metadata: {},
  user_metadata: {
    username: 'testuser',
    display_name: 'Test User',
  },
  aud: 'authenticated',
  role: 'authenticated',
  ...overrides,
} as User);

const mockOnOpenChange = vi.fn();
const mockOnUserUpdated = vi.fn();

const defaultProps = {
  user: createMockUser(),
  open: true,
  onOpenChange: mockOnOpenChange,
  currentUserId: 'current-admin-user-id',
  onUserUpdated: mockOnUserUpdated,
};

describe('UserDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('does not render when user is null', () => {
      render(<UserDetailDialog {...defaultProps} user={null} />);

      expect(screen.queryByTestId('user-detail-dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open with user', () => {
      render(<UserDetailDialog {...defaultProps} />);

      // Dialog content should be rendered
      expect(screen.getByTestId('user-detail-dialog')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<UserDetailDialog {...defaultProps} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays user display name if available', () => {
      render(<UserDetailDialog {...defaultProps} />);

      // Display name appears in header (h3) and in info section
      const displayNameElements = screen.getAllByText('Test User');

      expect(displayNameElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays username with @ prefix', () => {
      render(<UserDetailDialog {...defaultProps} />);

      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders all action buttons', () => {
      render(<UserDetailDialog {...defaultProps} />);

      expect(screen.getByText('actions.resetPassword')).toBeInTheDocument();
      expect(screen.getByText('actions.suspend')).toBeInTheDocument();
      expect(screen.getByText('actions.delete')).toBeInTheDocument();
    });

    it('shows unsuspend button for suspended user', () => {
      const suspendedUser = createMockUser({
        banned_until: '2099-12-31T00:00:00Z',
      });

      render(<UserDetailDialog {...defaultProps} user={suspendedUser} />);

      expect(screen.getByText('actions.unsuspend')).toBeInTheDocument();
    });
  });

  describe('self-preservation', () => {
    it('disables action buttons for own account', () => {
      const ownUser = createMockUser({ id: 'current-admin-user-id' });

      render(
        <UserDetailDialog
          {...defaultProps}
          user={ownUser}
          currentUserId="current-admin-user-id"
        />,
      );

      // Find action buttons - they should be disabled
      const resetButton = screen.getByTestId('action-actions.resetpassword');
      const suspendButton = screen.getByTestId('action-actions.suspend');
      const deleteButton = screen.getByTestId('action-actions.delete');

      expect(resetButton).toBeDisabled();
      expect(suspendButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it('shows warning message for own account', () => {
      const ownUser = createMockUser({ id: 'current-admin-user-id' });

      render(
        <UserDetailDialog
          {...defaultProps}
          user={ownUser}
          currentUserId="current-admin-user-id"
        />,
      );

      expect(screen.getByText('ownAccountWarning')).toBeInTheDocument();
    });

    it('does not show warning for other users', () => {
      render(<UserDetailDialog {...defaultProps} />);

      expect(screen.queryByText('ownAccountWarning')).not.toBeInTheDocument();
    });
  });

  describe('dialog close', () => {
    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();

      render(<UserDetailDialog {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: 'close' });
      await user.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('user info display', () => {
    it('displays signup date', () => {
      render(<UserDetailDialog {...defaultProps} />);

      expect(screen.getByText('fields.signupDate')).toBeInTheDocument();
      // Date formatted as "January 15, 2024"
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('displays "never" for users who never logged in', () => {
      const neverLoggedInUser = createMockUser({
        last_sign_in_at: undefined,
      });

      render(<UserDetailDialog {...defaultProps} user={neverLoggedInUser} />);

      expect(screen.getByText('never')).toBeInTheDocument();
    });
  });
});
