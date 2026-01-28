import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';

import { ActionCard } from '../ActionCard';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as any;

describe('ActionCard', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush });
  });

  const defaultProps = {
    icon: MessageSquare,
    title: 'Start a Conversation',
    description: 'Try our AI health companion',
    ctaText: 'Get Started',
    href: '/chat',
    index: 0,
  };

  it('renders icon, title, description, and button', () => {
    render(<ActionCard {...defaultProps} />);

    expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
    expect(screen.getByText('Try our AI health companion')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('navigates to href when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionCard {...defaultProps} />);

    const button = screen.getByRole('button', { name: /Get Started/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('applies correct styling when not completed', () => {
    const { container } = render(<ActionCard {...defaultProps} />);

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-white');
    expect(card).not.toHaveClass('bg-green-50/50');
  });

  it('applies completed styling when completed is true', () => {
    const { container } = render(<ActionCard {...defaultProps} completed />);

    const card = container.firstChild as HTMLElement;

    expect(card).toHaveClass('bg-green-50/50');
  });

  it('disables button when completed is true', () => {
    render(<ActionCard {...defaultProps} completed />);

    const button = screen.getByRole('button', { name: /Get Started/i });

    expect(button).toBeDisabled();
  });

  it('does not navigate when completed button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionCard {...defaultProps} completed />);

    const button = screen.getByRole('button', { name: /Get Started/i });
    await user.click(button);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<ActionCard {...defaultProps} variant="primary" />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<ActionCard {...defaultProps} variant="secondary" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    render(<ActionCard {...defaultProps} />);

    // The icon is rendered as an SVG element
    const svg = document.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('uses staggered animation based on index', () => {
    const { container, rerender } = render(<ActionCard {...defaultProps} index={0} />);

    expect(container.firstChild).toBeInTheDocument();

    rerender(<ActionCard {...defaultProps} index={2} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
