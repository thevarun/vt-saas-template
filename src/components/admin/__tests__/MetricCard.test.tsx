import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  describe('rendering', () => {
    it('renders title and value', () => {
      render(<MetricCard title="Total Users" value={1234} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('shows "--" when value is null', () => {
      render(<MetricCard title="Error Metric" value={null} />);

      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('shows 0 when value is zero', () => {
      render(<MetricCard title="Pending" value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('icon', () => {
    it('renders with icon when provided', () => {
      const { container } = render(
        <MetricCard title="Total Users" value={1234} icon={Users} />,
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders without icon when not provided', () => {
      const { container } = render(
        <MetricCard title="Total Users" value={1234} />,
      );

      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('trend indicator', () => {
    it('displays positive trend with green color', () => {
      const trend = { percentage: 12.5, direction: 'up' as const, isPositive: true };
      render(<MetricCard title="New Signups" value={50} trend={trend} />);

      const trendEl = screen.getByTestId('trend-indicator');

      expect(trendEl).toHaveClass('text-green-600');
      expect(screen.getByText('12.5%')).toBeInTheDocument();
    });

    it('displays negative trend with red color', () => {
      const trend = { percentage: 8.2, direction: 'down' as const, isPositive: false };
      render(<MetricCard title="Active Users" value={100} trend={trend} />);

      const trendEl = screen.getByTestId('trend-indicator');

      expect(trendEl).toHaveClass('text-red-600');
      expect(screen.getByText('8.2%')).toBeInTheDocument();
    });

    it('does not display trend when direction is neutral', () => {
      const trend = { percentage: 0, direction: 'neutral' as const, isPositive: false };
      render(<MetricCard title="Users" value={100} trend={trend} />);

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument();
    });

    it('does not display trend when loading', () => {
      const trend = { percentage: 12, direction: 'up' as const, isPositive: true };
      render(<MetricCard title="Users" value={100} trend={trend} loading />);

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      const { container } = render(
        <MetricCard title="Total Users" value={1234} loading />,
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows title even during loading', () => {
      render(<MetricCard title="Total Users" value={1234} loading />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('does not show value when loading', () => {
      render(<MetricCard title="Total Users" value={1234} loading />);

      expect(screen.queryByText('1234')).not.toBeInTheDocument();
    });
  });

  describe('clickable card', () => {
    it('wraps in link when href is provided', () => {
      render(<MetricCard title="Feedback" value={5} href="/admin/feedback" />);

      const link = screen.getByRole('link');

      expect(link).toHaveAttribute('href', '/admin/feedback');
    });

    it('applies hover styles when href is provided', () => {
      const { container } = render(
        <MetricCard title="Feedback" value={5} href="/admin/feedback" />,
      );

      const card = container.querySelector('.cursor-pointer');

      expect(card).toBeInTheDocument();
    });

    it('does not wrap in link when href is not provided', () => {
      render(<MetricCard title="Users" value={100} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
