import type { User } from '@supabase/supabase-js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserTable } from '../UserTable';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    // Handle parameterized strings
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

// Mock UserDetailDialog
vi.mock('../UserDetailDialog', () => ({
  UserDetailDialog: () => null,
}));

const CURRENT_USER_ID = 'current-admin-user-id';

// Create mock users
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
  user_metadata: { username: 'testuser' },
  aud: 'authenticated',
  role: 'authenticated',
  ...overrides,
} as User);

const mockUsers: User[] = [
  createMockUser({
    id: 'user-1',
    email: 'john@example.com',
    user_metadata: { username: 'johndoe' },
  }),
  createMockUser({
    id: 'user-2',
    email: 'jane@example.com',
    email_confirmed_at: undefined, // pending status
    last_sign_in_at: undefined,
    user_metadata: {},
  }),
  createMockUser({
    id: 'user-3',
    email: 'suspended@example.com',
    banned_until: '2025-12-31T00:00:00Z', // suspended status
    user_metadata: { username: 'baduser' },
  }),
];

describe('UserTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the user table with correct structure', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('user-table')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders all column headers', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('columns.user')).toBeInTheDocument();
      expect(screen.getByText('columns.status')).toBeInTheDocument();
      expect(screen.getByText('columns.signedUp')).toBeInTheDocument();
      expect(screen.getByText('columns.lastLogin')).toBeInTheDocument();
      expect(screen.getByText('columns.actions')).toBeInTheDocument();
    });

    it('renders user data correctly', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('noUsername')).toBeInTheDocument();
    });

    it('renders empty state when no users', () => {
      render(
        <UserTable
          users={[]}
          total={0}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('empty.noUsers')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('shows Active badge for confirmed users', () => {
      render(
        <UserTable
          users={[mockUsers[0]!]}
          total={1}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('status.active')).toBeInTheDocument();
    });

    it('shows Pending badge for unconfirmed users', () => {
      render(
        <UserTable
          users={[mockUsers[1]!]}
          total={1}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('status.pending')).toBeInTheDocument();
    });

    it('shows Suspended badge for banned users', () => {
      render(
        <UserTable
          users={[mockUsers[2]!]}
          total={1}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('status.suspended')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('renders search input', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('user-search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('search.placeholder')).toBeInTheDocument();
    });

    it('updates URL when searching', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const searchInput = screen.getByTestId('user-search-input');
      await user.type(searchInput, 'john');

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('search=john'),
        );
      });
    });
  });

  describe('selection functionality', () => {
    it('renders checkboxes for each user', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');

      // 1 select all + 3 user checkboxes
      expect(checkboxes).toHaveLength(4);
    });

    it('selects all users when select all is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      // Bulk actions bar should appear
      await waitFor(() => {
        expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
        expect(screen.getByText('3 bulkActions.selected')).toBeInTheDocument();
      });
    });

    it('shows bulk actions bar when users are selected', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      // Select one user
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]!); // First user checkbox

      await waitFor(() => {
        expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
      });
    });
  });

  describe('pagination', () => {
    it('renders pagination controls', () => {
      render(
        <UserTable
          users={mockUsers}
          total={100}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('pagination-prev')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
    });

    it('shows correct pagination info', () => {
      render(
        <UserTable
          users={mockUsers}
          total={100}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByText('pagination.showing')).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(
        <UserTable
          users={mockUsers}
          total={100}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('pagination-prev')).toBeDisabled();
    });

    it('navigates to next page when next is clicked', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={100}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const nextButton = screen.getByTestId('pagination-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
        );
      });
    });
  });

  describe('sorting', () => {
    it('renders sortable column headers', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('sort-email-button')).toBeInTheDocument();
      expect(screen.getByTestId('sort-signup-button')).toBeInTheDocument();
    });

    it('updates URL when sorting by email', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const sortButton = screen.getByTestId('sort-email-button');
      await user.click(sortButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('sort=email'),
        );
      });
    });
  });

  describe('status filter', () => {
    it('renders status filter dropdown', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      expect(screen.getByTestId('status-filter-button')).toBeInTheDocument();
    });

    it('opens filter dropdown and shows options', async () => {
      const user = userEvent.setup();

      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const filterButton = screen.getByTestId('status-filter-button');
      await user.click(filterButton);

      await waitFor(() => {
        // Button has filter.statusAll text + dropdown item has the same text
        const allStatusTexts = screen.getAllByText('filter.statusAll');

        expect(allStatusTexts.length).toBeGreaterThanOrEqual(1);
        // Check for status options in dropdown
        expect(screen.getAllByText('status.active')).toHaveLength(2); // One in badge, one in dropdown
      });
    });
  });

  describe('action buttons', () => {
    it('renders action buttons for each user', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      // Each user row should have view, edit, delete buttons
      const rows = screen.getAllByTestId(/user-row-/);

      expect(rows).toHaveLength(3);

      rows.forEach((row) => {
        const buttons = within(row).getAllByRole('button');

        // Each row has checkbox (not a button) and 3 action buttons
        expect(buttons.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('user avatars', () => {
    it('renders avatars with correct initials', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      // Username johndoe -> JO
      expect(screen.getByText('JO')).toBeInTheDocument();
      // Email jane@example.com (no username) -> JA
      expect(screen.getByText('JA')).toBeInTheDocument();
      // Username baduser -> BA
      expect(screen.getByText('BA')).toBeInTheDocument();
    });
  });

  describe('toolbar buttons', () => {
    it('renders Export button (disabled)', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const exportButton = screen.getByRole('button', { name: /actions.export/i });

      expect(exportButton).toBeInTheDocument();
      expect(exportButton).toBeDisabled();
    });

    it('renders Add User button (disabled)', () => {
      render(
        <UserTable
          users={mockUsers}
          total={3}
          page={1}
          search=""
          currentUserId={CURRENT_USER_ID}
        />,
      );

      const addButton = screen.getByRole('button', { name: /actions.addUser/i });

      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeDisabled();
    });
  });
});
