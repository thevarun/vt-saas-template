/* eslint-disable testing-library/render-result-naming-convention -- uses @react-email/render, not @testing-library */
import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import { EmailLayout, EmailText } from './EmailLayout';

const baseProps = {
  previewText: 'Preview text here',
  appUrl: 'https://example.com',
  brandName: 'My App',
};

describe('EmailLayout', () => {
  it('renders the brand name in the footer', async () => {
    const html = await render(
      <EmailLayout {...baseProps}>
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('receiving this because you signed up for');
    expect(html).toContain('My App');
  });

  it('renders children content', async () => {
    const html = await render(
      <EmailLayout {...baseProps}>
        <EmailText>Hello body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('Hello body');
  });

  it('falls back to the apple-touch-icon logo when no header image is given', async () => {
    const html = await render(
      <EmailLayout {...baseProps}>
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('https://example.com/apple-touch-icon.png');
  });

  it('uses the full-bleed header image when headerImageUrl is provided', async () => {
    const html = await render(
      <EmailLayout
        {...baseProps}
        headerImageUrl="https://example.com/email/header.png"
      >
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('https://example.com/email/header.png');
    expect(html).not.toContain('apple-touch-icon.png');
  });

  it('omits the preferences link by default', async () => {
    const html = await render(
      <EmailLayout {...baseProps}>
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).not.toContain('Update your email preferences');
  });

  it('renders the preferences link when includePreferencesLink is set', async () => {
    const html = await render(
      <EmailLayout {...baseProps} includePreferencesLink>
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('Update your email preferences');
    expect(html).toContain('https://example.com/settings');
  });

  it('honors a custom preferencesUrl', async () => {
    const html = await render(
      <EmailLayout
        {...baseProps}
        includePreferencesLink
        preferencesUrl="https://example.com/account/notifications"
      >
        <EmailText>Body</EmailText>
      </EmailLayout>,
    );

    expect(html).toContain('https://example.com/account/notifications');
  });
});
