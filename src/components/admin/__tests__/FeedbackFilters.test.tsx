import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FeedbackFilters } from '../FeedbackFilters';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'filters.type': 'Type',
        'filters.status': 'Status',
        'filters.allTypes': 'All Types',
        'filters.allStatuses': 'All Statuses',
        'filters.clearFilters': 'Clear Filters',
        'filters.activeFilters': '{count} active',
        'types.bug': 'Bug',
        'types.feature': 'Feature',
        'types.praise': 'Praise',
        'statuses.pending': 'Pending',
        'statuses.reviewed': 'Reviewed',
        'statuses.archived': 'Archived',
      };
      return translations[key] || key;
    };
    return t;
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/en/admin/feedback',
  useSearchParams: () => new URLSearchParams(),
}));

describe('FeedbackFilters', () => {
  it('renders type tabs', () => {
    render(<FeedbackFilters />);

    expect(screen.getByTestId('type-filter')).toBeInTheDocument();
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Praise')).toBeInTheDocument();
  });

  it('renders status select', () => {
    render(<FeedbackFilters />);

    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('does not show clear button when no filters active', () => {
    render(<FeedbackFilters />);

    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument();
  });
});
