import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

import type { WelcomeEmailData } from '../types';

type WelcomeEmailProps = WelcomeEmailData;

// Styles using inline CSS (required for email client compatibility)
const main = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  margin: '0 auto',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px 48px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#1e293b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const subheading = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const gettingStartedSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  margin: '24px 0',
  padding: '20px 24px',
};

const listItem = {
  color: '#1e293b',
  fontSize: '16px',
  lineHeight: '28px',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const supportText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const signoff = {
  color: '#1e293b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};

/**
 * Welcome Email Template
 *
 * Sent to new users after successful registration.
 * Supports personalization with recipient name.
 */
export function WelcomeEmail({
  recipientName,
  appName,
  appUrl,
}: WelcomeEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there';
  const dashboardUrl = `${appUrl}/dashboard`;
  const previewText = `Welcome to ${appName}! We're excited to have you on board.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with app branding */}
          <Section style={logoSection}>
            <Img
              src={`${appUrl}/apple-touch-icon.png`}
              width="40"
              height="40"
              alt={appName}
              style={logo}
            />
          </Section>

          {/* Welcome heading */}
          <Heading style={heading}>
            Welcome to
            {' '}
            {appName}
            !
          </Heading>

          {/* Personalized greeting */}
          <Text style={paragraph}>
            {greeting}
            ,
          </Text>

          <Text style={paragraph}>
            Thanks for signing up! We're excited to have you on board.
          </Text>

          {/* Getting started section */}
          <Section style={gettingStartedSection}>
            <Text style={subheading}>
              Here's what you can do next:
            </Text>
            <Text style={listItem}>
              - Complete your profile
            </Text>
            <Text style={listItem}>
              - Explore the dashboard
            </Text>
            <Text style={listItem}>
              - Try the AI assistant
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button href={dashboardUrl} style={button}>
              Get Started
            </Button>
          </Section>

          {/* Support section */}
          <Hr style={divider} />

          <Text style={supportText}>
            Need help? Reply to this email or visit our support page.
          </Text>

          <Text style={signoff}>
            Cheers,
            <br />
            The
            {' '}
            {appName}
            {' '}
            Team
          </Text>

          {/* Footer */}
          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because you signed up for
            {' '}
            {appName}
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
