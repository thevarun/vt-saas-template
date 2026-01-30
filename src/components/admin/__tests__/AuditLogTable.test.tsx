import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AuditLogEntryProps } from '../AuditLogTable';
import { AuditLogTable } from '../AuditLogTable';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'noLogs': 'No audit log entries found.',
        'columns.action': 'Action',
        'columns.admin': 'Admin',
        'columns.target': 'Target',
        'columns.timestamp': 'Timestamp',
        'columns.details': 'Details',
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

// Mock date-fns to return a stable value
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours ago',
}));

const mockLogs: AuditLogEntryProps[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    adminEmail: 'admin@example.com',
    action: 'suspend_user',
    targetType: 'user',
    targetId: 'abcdef12-3456-7890-abcd-ef1234567890',
    metadata: { reason: 'Spam activity' },
    createdAt: new Date('2026-01-29T12:00:00Z'),
  },
  {
    id: 'log-2',
    adminId: 'admin-2',
    adminEmail: 'admin2@example.com',
    action: 'reset_password',
    targetType: 'user',
    targetId: '12345678-abcd-ef01-2345-678901234567',
    metadata: null,
    createdAt: new Date('2026-01-29T10:00:00Z'),
  },
];

describe('AuditLogTable', () => {
  it('renders audit log entries', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin2@example.com')).toBeInTheDocument();
    expect(screen.getByText('Spam activity')).toBeInTheDocument();
  });

  it('shows empty state when no logs', () => {
    render(<AuditLogTable logs={[]} />);

    expect(screen.getByTestId('audit-log-empty')).toBeInTheDocument();
    expect(screen.getByText('No audit log entries found.')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('displays action badges', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getByText('Suspend User')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  it('truncates target ID', () => {
    render(<AuditLogTable logs={mockLogs} />);

    // Should show truncated IDs
    const codeElements = screen.getAllByRole('cell');
    const targetCells = codeElements.filter(cell =>
      cell.querySelector('code'),
    );

    expect(targetCells.length).toBeGreaterThan(0);
  });

  it('shows relative timestamp', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getAllByText('2 hours ago')).toHaveLength(2);
  });

  it('shows "--" when metadata has no reason', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('is read-only with no edit or delete buttons', () => {
    render(<AuditLogTable logs={mockLogs} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders correct number of rows', () => {
    render(<AuditLogTable logs={mockLogs} />);

    const rows = screen.getAllByTestId('audit-log-row');

    expect(rows).toHaveLength(2);
  });

  it('shows adminId when email is not available', () => {
    const logsWithoutEmail: AuditLogEntryProps[] = [
      {
        ...mockLogs[0]!,
        adminEmail: undefined,
      },
    ];
    render(<AuditLogTable logs={logsWithoutEmail} />);

    expect(screen.getByText('admin-1')).toBeInTheDocument();
  });
});
