import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({ locale: 'en' })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// eslint-disable-next-line import/first -- mocks must be hoisted above imports under test
import DevSignInPage from './page';

describe('DevSignInPage — production guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { container } = render(<DevSignInPage />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the form with default test credentials in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(<DevSignInPage />);

    expect(
      screen.getByRole('heading', { name: /dev sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/development only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@test.com');
  });
});
