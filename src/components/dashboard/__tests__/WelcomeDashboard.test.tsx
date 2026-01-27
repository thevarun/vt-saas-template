import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { WelcomeDashboard } from '../WelcomeDashboard';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as any;

describe('WelcomeDashboard', () => {
  const mockPush = vi.fn();
  const mockTranslate = vi.fn((key: string, params?: any) => {
    if (key === 'welcomeTitle' && params?.name) {
      return `Welcome, ${params.name}!`;
    }
    if (key === 'welcomeDescription') {
      return 'Let\'s get you started with your health journey';
    }
    if (key === 'gettingStartedTitle') {
      return 'Getting Started';
    }
    if (key === 'actionStartChat') {
      return 'Start a Conversation';
    }
    if (key === 'actionStartChatDesc') {
      return 'Try our AI health companion';
    }
    if (key === 'actionCompleteProfile') {
      return 'Complete Your Profile';
    }
    if (key === 'actionCompleteProfileDesc') {
      return 'Add more details about yourself';
    }
    if (key === 'actionExploreFeatures') {
      return 'Explore Features';
    }
    if (key === 'actionExploreFeaturesDesc') {
      return 'Learn what you can do';
    }
    if (key === 'actionButtonLabel') {
      return 'Get Started';
    }
    return key;
  });

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useTranslations as any).mockReturnValue(mockTranslate);
  });

  it('renders welcome message with user name', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(screen.getByText('Welcome, Sarah!')).toBeInTheDocument();
  });

  it('renders welcome description', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(
      screen.getByText('Let\'s get you started with your health journey'),
    ).toBeInTheDocument();
  });

  it('renders Getting Started section heading', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
  });

  it('renders all 3 action cards', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
    expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Explore Features')).toBeInTheDocument();
  });

  it('renders action card descriptions', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(screen.getByText('Try our AI health companion')).toBeInTheDocument();
    expect(
      screen.getByText('Add more details about yourself'),
    ).toBeInTheDocument();
    expect(screen.getByText('Learn what you can do')).toBeInTheDocument();
  });

  it('renders action buttons for each card', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    const buttons = screen.getAllByRole('button', { name: /Get Started/i });

    expect(buttons).toHaveLength(3);
  });

  it('navigates to /chat when Start a Conversation is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeDashboard userName="Sarah" />);

    const buttons = screen.getAllByRole('button', { name: /Get Started/i });
    await user.click(buttons[0]!);

    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('navigates to /dashboard/user-profile when Complete Your Profile is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeDashboard userName="Sarah" />);

    const buttons = screen.getAllByRole('button', { name: /Get Started/i });
    await user.click(buttons[1]!);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/user-profile');
  });

  it('navigates to /dashboard when Explore Features is clicked', async () => {
    const user = userEvent.setup();
    render(<WelcomeDashboard userName="Sarah" />);

    const buttons = screen.getAllByRole('button', { name: /Get Started/i });
    await user.click(buttons[2]!);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('uses translations for all text content', () => {
    render(<WelcomeDashboard userName="John" />);

    expect(mockTranslate).toHaveBeenCalledWith('welcomeTitle', { name: 'John' });
    expect(mockTranslate).toHaveBeenCalledWith('welcomeDescription');
    expect(mockTranslate).toHaveBeenCalledWith('gettingStartedTitle');
    expect(mockTranslate).toHaveBeenCalledWith('actionStartChat');
    expect(mockTranslate).toHaveBeenCalledWith('actionStartChatDesc');
    expect(mockTranslate).toHaveBeenCalledWith('actionCompleteProfile');
    expect(mockTranslate).toHaveBeenCalledWith('actionCompleteProfileDesc');
    expect(mockTranslate).toHaveBeenCalledWith('actionExploreFeatures');
    expect(mockTranslate).toHaveBeenCalledWith('actionExploreFeaturesDesc');
    expect(mockTranslate).toHaveBeenCalledWith('actionButtonLabel');
  });

  it('renders emoji in welcome message', () => {
    render(<WelcomeDashboard userName="Sarah" />);

    expect(screen.getByText('👋')).toBeInTheDocument();
  });
});
