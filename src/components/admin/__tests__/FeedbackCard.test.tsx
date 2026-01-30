import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FeedbackEntry } from '@/libs/queries/feedback';

import { FeedbackCard } from '../FeedbackCard';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'types.bug': 'Bug',
        'types.feature': 'Feature',
        'types.praise': 'Praise',
        'statuses.pending': 'Pending',
        'statuses.reviewed': 'Reviewed',
        'statuses.archived': 'Archived',
        'anonymous': 'Anonymous',
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

// Mock FeedbackDetailDialog to avoid Dialog complexity in tests
vi.mock('../FeedbackDetailDialog', () => ({
  FeedbackDetailDialog: () => null,
}));

const mockFeedback: FeedbackEntry = {
  id: 'fb-1',
  type: 'bug',
  message: 'This is a bug report with some details about the issue.',
  email: 'user@example.com',
  status: 'pending',
  userId: 'user-1',
  createdAt: new Date('2026-01-29T12:00:00Z'),
  reviewedAt: null,
};

describe('FeedbackCard', () => {
  it('renders feedback type badge', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByTestId('feedback-type-badge')).toHaveTextContent('Bug');
  });

  it('renders message preview', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByTestId('feedback-message')).toHaveTextContent(
      'This is a bug report with some details about the issue.',
    );
  });

  it('truncates long messages', () => {
    const longMessage = 'A'.repeat(150);
    const longFeedback = { ...mockFeedback, message: longMessage };
    render(<FeedbackCard feedback={longFeedback} />);

    const messageEl = screen.getByTestId('feedback-message');

    expect(messageEl).toHaveTextContent(/\.\.\./);
    expect(messageEl.textContent!.length).toBeLessThan(150);
  });

  it('renders email', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByTestId('feedback-email')).toHaveTextContent('user@example.com');
  });

  it('shows Anonymous when no email', () => {
    const anonFeedback = { ...mockFeedback, email: null };
    render(<FeedbackCard feedback={anonFeedback} />);

    expect(screen.getByTestId('feedback-email')).toHaveTextContent('Anonymous');
  });

  it('renders relative timestamp', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByTestId('feedback-timestamp')).toHaveTextContent('2 hours ago');
  });

  it('renders status badge', () => {
    render(<FeedbackCard feedback={mockFeedback} />);

    expect(screen.getByTestId('feedback-status-badge')).toHaveTextContent('Pending');
  });
});
