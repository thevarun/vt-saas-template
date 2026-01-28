import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslations } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OnboardingFeatureTour } from '../OnboardingFeatureTour';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

describe('OnboardingFeatureTour', () => {
  const mockTranslations: Record<string, string> = {
    step2Title: 'Discover What You Can Do',
    step2Description: 'Here are some of the key features you\'ll have access to',
    feature1Title: 'AI-Powered Chat',
    feature1Description: 'Intelligent conversations powered by advanced AI to help you get things done',
    feature2Title: 'Multi-Language Support',
    feature2Description: 'Available in English, Hindi, and Bengali for a localized experience',
    feature3Title: 'Secure & Private',
    feature3Description: 'Your data is protected with enterprise-grade security and encryption',
    feature4Title: 'Fast & Responsive',
    feature4Description: 'Lightning-fast performance optimized for all devices',
    continue: 'Continue',
    goBack: 'Go back',
    progressStep: 'Step 2 of 3',
  };

  // Mock window.location
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
      (key: string) => mockTranslations[key] || key,
    );
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders the component with header and description', () => {
    render(<OnboardingFeatureTour />);

    expect(screen.getByText('Discover What You Can Do')).toBeInTheDocument();
    expect(screen.getByText('Here are some of the key features you\'ll have access to')).toBeInTheDocument();
  });

  it('renders progress indicator showing step 2 of 3', () => {
    render(<OnboardingFeatureTour />);

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('renders all 4 feature cards with titles and descriptions', () => {
    render(<OnboardingFeatureTour />);

    // Check all feature titles
    expect(screen.getByText('AI-Powered Chat')).toBeInTheDocument();
    expect(screen.getByText('Multi-Language Support')).toBeInTheDocument();
    expect(screen.getByText('Secure & Private')).toBeInTheDocument();
    expect(screen.getByText('Fast & Responsive')).toBeInTheDocument();

    // Check all feature descriptions
    expect(screen.getByText(/Intelligent conversations powered by advanced AI/)).toBeInTheDocument();
    expect(screen.getByText(/Available in English, Hindi, and Bengali/)).toBeInTheDocument();
    expect(screen.getByText(/Your data is protected with enterprise-grade security/)).toBeInTheDocument();
    expect(screen.getByText(/Lightning-fast performance optimized for all devices/)).toBeInTheDocument();
  });

  it('renders Continue and Go back buttons', () => {
    render(<OnboardingFeatureTour />);

    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go back/i })).toBeInTheDocument();
  });

  it('navigates to step 3 when Continue button is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingFeatureTour />);

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);

    expect(window.location.href).toBe('/onboarding?step=3');
  });

  it('navigates to step 1 when Go back button is clicked', async () => {
    const user = userEvent.setup();
    render(<OnboardingFeatureTour />);

    const goBackButton = screen.getByRole('button', { name: /Go back/i });
    await user.click(goBackButton);

    expect(window.location.href).toBe('/onboarding?step=1');
  });

  it('has correct grid layout classes for responsive design', () => {
    const { container } = render(<OnboardingFeatureTour />);

    // Check that the feature grid has responsive classes
    const featureGrid = container.querySelector('.grid');

    expect(featureGrid).toHaveClass('grid-cols-1');
    expect(featureGrid).toHaveClass('md:grid-cols-2');
  });

  it('renders feature card icons', () => {
    const { container } = render(<OnboardingFeatureTour />);

    // Check that icons are rendered (they have the lucide-react class or are SVGs)
    const icons = container.querySelectorAll('svg');

    // We expect at least 4 icons for features + 1 for arrow + progress indicator
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });
});
