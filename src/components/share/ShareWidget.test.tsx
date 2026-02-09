import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ShareWidget } from './ShareWidget';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

// Mock window.open
const mockWindowOpen = vi.fn();
const originalWindowOpen = window.open;
window.open = mockWindowOpen;

// Mock navigator.clipboard
const mockWriteText = vi.fn(() => Promise.resolve());
const originalClipboard = navigator.clipboard;
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
});

describe('shareWidget', () => {
  const defaultProps = {
    url: 'https://example.com/article',
    title: 'Check out this article!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockWriteText.mockClear();
  });

  afterAll(() => {
    window.open = originalWindowOpen;
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe('inline variant', () => {
    it('renders all platform buttons by default', () => {
      render(<ShareWidget {...defaultProps} variant="inline" />);

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    it('renders only specified platforms', () => {
      render(
        <ShareWidget
          {...defaultProps}
          variant="inline"
          platforms={['twitter', 'copy']}
        />,
      );

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share on linkedin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share on facebook/i })).not.toBeInTheDocument();
    });

    it('opens Twitter share dialog when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} variant="inline" />);

      const xButton = screen.getByRole('button', { name: /share on x/i });
      await user.click(xButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer,width=600,height=400',
      );
    });

    it('opens LinkedIn share dialog when LinkedIn button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} variant="inline" />);

      const linkedInButton = screen.getByRole('button', { name: /share on linkedin/i });
      await user.click(linkedInButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing'),
        '_blank',
        'noopener,noreferrer,width=600,height=400',
      );
    });

    it('opens Facebook share dialog when Facebook button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} variant="inline" />);

      const facebookButton = screen.getByRole('button', { name: /share on facebook/i });
      await user.click(facebookButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'noopener,noreferrer,width=600,height=400',
      );
    });
  });

  describe('minimal variant', () => {
    it('renders icon-only buttons', () => {
      render(
        <TooltipProvider>
          <ShareWidget {...defaultProps} variant="minimal" />
        </TooltipProvider>,
      );

      // Buttons should not have visible text labels
      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(4);

      buttons.forEach((button) => {
        // Should have aria-label but no visible text
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('popup variant', () => {
    it('renders a single share trigger button', () => {
      render(<ShareWidget {...defaultProps} variant="popup" />);

      const triggerButton = screen.getByRole('button', { name: /share/i });

      expect(triggerButton).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-labels on inline buttons', () => {
      render(<ShareWidget {...defaultProps} variant="inline" />);

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument();
    });

    it('has proper aria-label on popup trigger', () => {
      render(<ShareWidget {...defaultProps} variant="popup" />);

      const trigger = screen.getByRole('button', { name: /share/i });

      expect(trigger).toBeInTheDocument();
    });

    it('has touch-friendly button sizes (min 44x44)', () => {
      const { container } = render(<ShareWidget {...defaultProps} variant="inline" />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
        expect(button).toHaveClass('min-w-[44px]');
      });
    });
  });

  describe('url encoding', () => {
    it('properly encodes URLs with special characters', async () => {
      const user = userEvent.setup();
      const specialUrl = 'https://example.com/article?id=123&ref=test';
      const specialTitle = 'Article Title & More!';

      render(<ShareWidget url={specialUrl} title={specialTitle} variant="inline" />);

      const xButton = screen.getByRole('button', { name: /share on x/i });
      await user.click(xButton);

      const calledUrl = mockWindowOpen.mock.calls[0]?.[0];

      expect(calledUrl).toBeDefined();
      expect(calledUrl).toContain(encodeURIComponent(specialUrl));
      expect(calledUrl).toContain(encodeURIComponent(specialTitle));
    });
  });

  describe('custom platforms', () => {
    it('allows custom platform selection', () => {
      render(
        <ShareWidget
          {...defaultProps}
          variant="inline"
          platforms={['twitter', 'linkedin']}
        />,
      );

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share on facebook/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument();
    });
  });

  describe('component props', () => {
    it('accepts className prop', () => {
      const { container } = render(
        <ShareWidget {...defaultProps} variant="inline" className="custom-class" />,
      );

      const wrapper = container.querySelector('.custom-class');

      expect(wrapper).toBeInTheDocument();
    });

    it('accepts description prop', () => {
      render(
        <ShareWidget
          {...defaultProps}
          variant="inline"
          description="This is a test description"
        />,
      );

      // Component should render without errors
      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
    });
  });
});
