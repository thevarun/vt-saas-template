import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useUpdateUserPreferences,
  useUserPreferences,
} from '@/libs/hooks/use-user-preferences';

import { NotificationsSection } from './notifications-section';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/libs/hooks/use-user-preferences', () => ({
  useUserPreferences: vi.fn(),
  useUpdateUserPreferences: vi.fn(),
}));

const mockTranslate = vi.fn((key: string) => key);

function mockPrefs(emailNotifications: boolean) {
  (useUserPreferences as any).mockReturnValue({
    data: { emailNotifications, language: 'en', username: 'tester' },
    isLoading: false,
  });
}

describe('NotificationsSection', () => {
  const mutateAsync = vi.fn().mockResolvedValue({
    emailNotifications: false,
    language: 'en',
    username: 'tester',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslations as any).mockReturnValue(mockTranslate);
    (useUpdateUserPreferences as any).mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('reflects loaded preferences in the switch', () => {
    mockPrefs(true);

    render(<NotificationsSection />);

    const toggle = screen.getByRole('switch', { name: 'email_notifications' });

    expect(toggle).toBeChecked();
  });

  it('disables Save until the toggle is changed, then saves with the new value', async () => {
    const user = userEvent.setup();
    mockPrefs(true);

    render(<NotificationsSection />);

    const saveButton = screen.getByRole('button', { name: 'save_notifications' });

    expect(saveButton).toBeDisabled();

    const toggle = screen.getByRole('switch', { name: 'email_notifications' });
    await user.click(toggle);

    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ emailNotifications: false });
    });

    expect(toast.success).toHaveBeenCalled();
  });
});
