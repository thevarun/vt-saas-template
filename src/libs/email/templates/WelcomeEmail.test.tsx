import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import { WelcomeEmail } from './WelcomeEmail';

describe('WelcomeEmail Template', () => {
  const defaultProps = {
    recipientEmail: 'test@example.com',
    appName: 'VT SaaS Template',
    appUrl: 'https://example.com',
  };

  describe('rendering', () => {
    it('renders with name provided', async () => {
      const html = await render(
        <WelcomeEmail
          {...defaultProps}
          recipientName="John"
        />,
      );

      expect(html).toContain('Hi John');
      expect(html).not.toContain('Hi there');
    });

    it('renders without name (fallback greeting)', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      expect(html).toContain('Hi there');
      expect(html).not.toContain('Hi undefined');
    });
  });

  describe('content', () => {
    it('contains CTA button with correct URL', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      expect(html).toContain('https://example.com/dashboard');
      expect(html).toContain('Get Started');
    });

    it('contains app name in content', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      expect(html).toContain('VT SaaS Template');
    });

    it('contains required sections: greeting, getting started, footer', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      // Greeting section
      expect(html).toContain('Welcome to');

      // Getting started section
      expect(html).toContain('what you can do next');

      // Footer with support info
      expect(html).toContain('Need help');

      // Unsubscribe note
      expect(html).toContain('receiving this');
    });

    it('contains preview text', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      // Preview component renders with special preview text
      expect(html).toContain('excited to have you');
    });
  });

  describe('styling', () => {
    it('uses brand primary color for CTA button', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      // Primary color: #2563eb (blue-600)
      expect(html).toContain('#2563eb');
    });

    it('has max-width 600px container', async () => {
      const html = await render(
        <WelcomeEmail {...defaultProps} />,
      );

      expect(html).toContain('600px');
    });
  });

  describe('personalization', () => {
    it('handles different app URLs', async () => {
      const html = await render(
        <WelcomeEmail
          {...defaultProps}
          appUrl="https://myapp.com"
        />,
      );

      expect(html).toContain('https://myapp.com/dashboard');
    });

    it('handles different app names', async () => {
      const html = await render(
        <WelcomeEmail
          {...defaultProps}
          appName="Custom App"
        />,
      );

      expect(html).toContain('Welcome to Custom App');
    });
  });
});
