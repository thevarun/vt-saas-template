import type { ReconnectDaysRemaining, ReconnectReminderEmailData } from '../types';
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailText,
} from './EmailLayout';
import { safeGreeting } from './helpers';

export type { ReconnectDaysRemaining } from '../types';

type ReconnectReminderEmailProps = ReconnectReminderEmailData;

/** Human phrase for the countdown, e.g. "tomorrow" or "in 7 days". */
function whenLabel(daysRemaining: ReconnectDaysRemaining): string {
  if (daysRemaining <= 1) {
    return 'tomorrow';
  }
  return `in ${daysRemaining} days`;
}

function copy(platform: string, daysRemaining: ReconnectDaysRemaining) {
  const when = whenLabel(daysRemaining);
  return {
    preview: `Reconnect ${platform} to keep your integrations working`,
    heading: daysRemaining <= 1
      ? `Your ${platform} connection expires tomorrow`
      : `Your ${platform} connection expires in ${daysRemaining} days`,
    body: `Your ${platform} connection expires ${when}. Reconnect to keep your integrations working — it only takes a few seconds.`,
    cta: `Reconnect ${platform}`,
  };
}

export function ReconnectReminderEmail(props: ReconnectReminderEmailProps) {
  const { recipientName, appUrl, appName, platform, daysRemaining } = props;
  const c = copy(platform, daysRemaining);
  const connectionsUrl = `${appUrl}/connections`;

  return (
    <EmailLayout
      previewText={c.preview}
      appUrl={appUrl}
      brandName={appName}
      includePreferencesLink
    >
      <EmailHeading>{c.heading}</EmailHeading>
      <EmailText>{safeGreeting(recipientName)}</EmailText>
      <EmailText>{c.body}</EmailText>
      <EmailButton href={connectionsUrl}>{c.cta}</EmailButton>
    </EmailLayout>
  );
}

ReconnectReminderEmail.PreviewProps = {
  recipientEmail: 'preview@example.com',
  recipientName: 'Alex',
  appName: 'VT SaaS Template',
  appUrl: 'https://example.com',
  platform: 'Acme',
  daysRemaining: 7,
} satisfies ReconnectReminderEmailProps;

export default ReconnectReminderEmail;
