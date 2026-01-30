import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuditLogFilters } from '../AuditLogFilters';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/en/admin/audit',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'filters.action': 'Action Type',
        'filters.allActions': 'All Actions',
        'filters.startDate': 'Start Date',
        'filters.endDate': 'End Date',
        'filters.apply': 'Apply Filters',
        'filters.clear': 'Clear Filters',
        'actions.suspend_user': 'Suspend User',
        'actions.unsuspend_user': 'Unsuspend User',
        'actions.delete_user': 'Delete User',
        'actions.reset_password': 'Reset Password',
      };
      return translations[key] || key;
    };
    return t;
  },
}));

describe('AuditLogFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter controls', () => {
    render(<AuditLogFilters />);

    expect(screen.getByText('Action Type')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByTestId('apply-filters')).toBeInTheDocument();
  });

  it('renders apply filters button', () => {
    render(<AuditLogFilters />);

    expect(screen.getByText('Apply Filters')).toBeInTheDocument();
  });

  it('navigates when apply is clicked', () => {
    render(<AuditLogFilters />);

    fireEvent.click(screen.getByTestId('apply-filters'));

    expect(mockPush).toHaveBeenCalledWith('/en/admin/audit?');
  });

  it('renders date inputs', () => {
    render(<AuditLogFilters />);

    expect(screen.getByTestId('start-date-filter')).toBeInTheDocument();
    expect(screen.getByTestId('end-date-filter')).toBeInTheDocument();
  });

  it('navigates with date params when dates are set and applied', () => {
    render(<AuditLogFilters />);

    fireEvent.change(screen.getByTestId('start-date-filter'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByTestId('end-date-filter'), {
      target: { value: '2026-01-31' },
    });
    fireEvent.click(screen.getByTestId('apply-filters'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('startDate=2026-01-01'),
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('endDate=2026-01-31'),
    );
  });

  it('does not show clear button when no filters are active', () => {
    render(<AuditLogFilters />);

    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument();
  });
});
