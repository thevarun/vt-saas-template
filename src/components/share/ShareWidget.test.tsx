import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

  describe('share button', () => {
    it('renders a single Share button', () => {
      render(<ShareWidget {...defaultProps} />);

      const button = screen.getByRole('button', { name: /share/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Share');
    });

    it('accepts className prop', () => {
      const { container } = render(
        <ShareWidget {...defaultProps} className="custom-class" />,
      );

      const button = container.querySelector('.custom-class');

      expect(button).toBeInTheDocument();
    });
  });

  describe('share modal', () => {
    it('opens modal when Share button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Share' })).toBeInTheDocument();
    });

    it('shows all platform buttons inside modal', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    it('shows only specified platforms', async () => {
      const user = userEvent.setup();
      render(
        <ShareWidget
          {...defaultProps}
          platforms={['twitter', 'copy']}
        />,
      );

      await user.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share on linkedin/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /share on facebook/i })).not.toBeInTheDocument();
    });
  });

  describe('share actions from modal', () => {
    it('opens Twitter in a new tab when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));
      await user.click(screen.getByRole('button', { name: /share on x/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('opens LinkedIn in a new tab when LinkedIn button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));
      await user.click(screen.getByRole('button', { name: /share on linkedin/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing'),
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('opens Facebook in a new tab when Facebook button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));
      await user.click(screen.getByRole('button', { name: /share on facebook/i }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('copies URL when Copy Link is clicked', async () => {
      const user = userEvent.setup();
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(clipboardSpy).toHaveBeenCalledWith('https://example.com/article');
      });
    });
  });

  describe('url encoding', () => {
    it('properly encodes URLs with special characters', async () => {
      const user = userEvent.setup();
      const specialUrl = 'https://example.com/article?id=123&ref=test';
      const specialTitle = 'Article Title & More!';

      render(<ShareWidget url={specialUrl} title={specialTitle} />);

      await user.click(screen.getByRole('button', { name: /share/i }));
      await user.click(screen.getByRole('button', { name: /share on x/i }));

      const calledUrl = mockWindowOpen.mock.calls[0]?.[0];

      expect(calledUrl).toBeDefined();
      expect(calledUrl).toContain(encodeURIComponent(specialUrl));
      expect(calledUrl).toContain(encodeURIComponent(specialTitle));
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on Share button', () => {
      render(<ShareWidget {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /share/i });

      expect(trigger).toBeInTheDocument();
    });

    it('has proper aria-labels on modal buttons', async () => {
      const user = userEvent.setup();
      render(<ShareWidget {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /share/i }));

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });
  });
});
