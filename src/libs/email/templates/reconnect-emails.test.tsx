/* eslint-disable testing-library/render-result-naming-convention -- uses @react-email/render, not @testing-library */
import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import { ReconnectReminderEmail } from './ReconnectReminderEmail';

// Render to plain text so JSX whitespace expressions ({' '}) collapse into real
// spaces. The plain-text renderer uppercases headings, so heading assertions are
// case-insensitive. This template carries no hardcoded product copy — the brand
// (appName) and connection label (platform) come from props.

describe('ReconnectReminderEmail template', () => {
  it('renders the platform label from props, not a hardcoded provider', async () => {
    const text = await render(
      <ReconnectReminderEmail {...ReconnectReminderEmail.PreviewProps} platform="Acme" />,
      { plainText: true },
    );

    expect(text).toContain('Acme');
    expect(text).toMatch(/Reconnect Acme/i);
    expect(text).not.toMatch(/LinkedIn|ContentFlow/i);
  });

  it('renders the multi-day countdown for a T-7 reminder', async () => {
    const text = await render(
      <ReconnectReminderEmail {...ReconnectReminderEmail.PreviewProps} daysRemaining={7} />,
      { plainText: true },
    );

    expect(text).toMatch(/expires in 7 days/i);
  });

  it('renders the "tomorrow" copy for a T-1 reminder', async () => {
    const text = await render(
      <ReconnectReminderEmail {...ReconnectReminderEmail.PreviewProps} daysRemaining={1} />,
      { plainText: true },
    );

    expect(text).toMatch(/expires tomorrow/i);
  });
});
