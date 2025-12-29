import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Thread } from '@/libs/supabase/threads';

import { ThreadListSidebar } from './ThreadListSidebar';

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = '/chat';
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock threads data
const mockThreads: Thread[] = [
  {
    id: '1',
    user_id: 'user-1',
    conversation_id: 'conv-1',
    title: 'Health Tips',
    last_message_preview: 'How can I improve my diet?',
    archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-1',
    conversation_id: 'conv-2',
    title: 'Fitness Advice',
    last_message_preview: 'What exercises should I do?',
    archived: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('ThreadListSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('AC #2: Fetch and display threads', () => {
    it('should fetch threads on mount and display them', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threads: mockThreads, count: 2 }),
      });

      render(<ThreadListSidebar />);

      // Wait for threads to load
      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
        expect(screen.getByText('Fitness Advice')).toBeInTheDocument();
      });
    });

    it('should filter out archived threads', async () => {
      const threadsWithArchived = [
        ...mockThreads,
        {
          ...mockThreads[0],
          id: '3',
          title: 'Archived Thread',
          archived: true,
        },
      ];

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threads: threadsWithArchived, count: 3 }),
      });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });

      expect(screen.queryByText('Archived Thread')).not.toBeInTheDocument();
    });
  });

  describe('AC #3: New Thread button', () => {
    it('should navigate to /chat when New Thread button is clicked', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threads: mockThreads, count: 2 }),
      });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /new/i });
      await userEvent.click(newButton);

      expect(mockPush).toHaveBeenCalledWith('/chat');
    });
  });

  describe('AC #4: Thread navigation', () => {
    it('should navigate to /chat/[threadId] when thread is clicked', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threads: mockThreads, count: 2 }),
      });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });

      const threadItem = screen.getByText('Health Tips');
      await userEvent.click(threadItem);

      expect(mockPush).toHaveBeenCalledWith('/chat/1');
    });
  });

  describe('AC #6: Archive functionality', () => {
    it('should remove thread from sidebar when archive button is clicked', async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ threads: mockThreads, count: 2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ thread: { ...mockThreads[0], archived: true } }),
        });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });

      // Find and click archive button (it's hidden until hover, but clickable)
      const archiveButtons = screen.getAllByLabelText(/archive/i);
      await userEvent.click(archiveButtons[0]!);

      // Thread should be removed immediately (optimistic update)
      await waitFor(() => {
        expect(screen.queryByText('Health Tips')).not.toBeInTheDocument();
      });
    });

    it('should restore thread if archive request fails', async () => {
      (globalThis.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ threads: mockThreads, count: 2 }),
        })
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ threads: mockThreads, count: 2 }),
        });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });

      const archiveButtons = screen.getAllByLabelText(/archive/i);
      await userEvent.click(archiveButtons[0]!);

      // Thread should reappear after refetch
      await waitFor(() => {
        expect(screen.getByText('Health Tips')).toBeInTheDocument();
      });
    });
  });

  describe('AC #10: Loading state', () => {
    it('should display skeleton while loading', () => {
      (globalThis.fetch as any).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ threads: mockThreads, count: 2 }),
                }),
              100,
            ),
          ),
      );

      render(<ThreadListSidebar />);

      // Should show skeleton loading state
      expect(screen.queryByText('Health Tips')).not.toBeInTheDocument();
    });
  });

  describe('AC #11: Empty state', () => {
    it('should display empty state when no threads exist', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ threads: [], count: 0 }),
      });

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(
          screen.getByText(/start your first conversation/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when fetch fails', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<ThreadListSidebar />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load threads/i)).toBeInTheDocument();
      });
    });
  });
});
