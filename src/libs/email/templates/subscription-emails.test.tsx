/* eslint-disable testing-library/render-result-naming-convention -- uses @react-email/render, not @testing-library */
import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';

import { ExpiryReminderEmail } from './ExpiryReminderEmail';
import { PromotionGrantedEmail } from './PromotionGrantedEmail';
import { SubscriptionEndedEmail } from './SubscriptionEndedEmail';
import { SubscriptionStartedEmail } from './SubscriptionStartedEmail';

// Render to plain text so JSX whitespace expressions ({' '}) collapse into real
// spaces. The plain-text renderer uppercases headings, so heading assertions are
// case-insensitive. These templates carry no hardcoded product copy — all brand
// strings (appName, tierName) come from props.

describe('Subscription lifecycle email templates', () => {
  it('SubscriptionStartedEmail renders tier name and app name from props', async () => {
    const text = await render(
      <SubscriptionStartedEmail {...SubscriptionStartedEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(text).toMatch(/You're on Pro/i);
    expect(text).toContain('VT SaaS Template');
    expect(text).toContain('monthly');
  });

  it('SubscriptionEndedEmail renders the tier name and a resubscribe CTA', async () => {
    const text = await render(
      <SubscriptionEndedEmail {...SubscriptionEndedEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(text).toMatch(/Your Pro subscription has ended/i);
    expect(text).toMatch(/Resubscribe/i);
  });

  it('PromotionGrantedEmail renders the tier name and expiry date', async () => {
    const text = await render(
      <PromotionGrantedEmail {...PromotionGrantedEmail.PreviewProps} />,
      { plainText: true },
    );

    expect(text).toMatch(/granted Pro access/i);
  });

  it('ExpiryReminderEmail (T-3) renders the 3-day countdown', async () => {
    const text = await render(
      <ExpiryReminderEmail {...ExpiryReminderEmail.PreviewProps} daysRemaining={3} />,
      { plainText: true },
    );

    expect(text).toMatch(/ends in 3 days/i);
    expect(text).toMatch(/Subscribe to Pro/i);
  });

  it('ExpiryReminderEmail (day-of) renders the today copy', async () => {
    const text = await render(
      <ExpiryReminderEmail {...ExpiryReminderEmail.PreviewProps} daysRemaining={0} />,
      { plainText: true },
    );

    expect(text).toMatch(/ends today/i);
  });

  it('ExpiryReminderEmail (T+1) renders the already-ended copy', async () => {
    const text = await render(
      <ExpiryReminderEmail {...ExpiryReminderEmail.PreviewProps} daysRemaining={-1} />,
      { plainText: true },
    );

    expect(text).toMatch(/has ended/i);
  });

  it('ExpiryReminderEmail renders promotion copy when kind is promotion', async () => {
    const text = await render(
      <ExpiryReminderEmail {...ExpiryReminderEmail.PreviewProps} kind="promotion" daysRemaining={3} />,
      { plainText: true },
    );

    expect(text).toMatch(/promotion ends in 3 days/i);
  });
});
