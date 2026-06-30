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
import type { ReactNode } from 'react';

import * as s from './styles';

type EmailLayoutProps = {
  previewText: string;
  appUrl: string;
  /** Brand name used in the header logo alt text and footer copy. */
  brandName: string;
  children: ReactNode;
  /**
   * Full-bleed header image URL. When provided, it renders edge-to-edge at the
   * top of the card. When omitted, the layout falls back to a centered
   * `apple-touch-icon.png` logo, so no branded header asset is required.
   */
  headerImageUrl?: string;
  /**
   * When true, the footer appends an "Update your email preferences" link after
   * the standard sign-up explainer. Use for emails whose delivery is gated by a
   * user preference (lifecycle / notification emails). Omit for transactional
   * emails the user can't opt out of (auth emails, etc.).
   */
  includePreferencesLink?: boolean;
  /** Destination for the preferences link. Defaults to `${appUrl}/settings`. */
  preferencesUrl?: string;
};

export function EmailLayout({
  previewText,
  appUrl,
  brandName,
  children,
  headerImageUrl,
  includePreferencesLink,
  preferencesUrl,
}: EmailLayoutProps) {
  const settingsHref = preferencesUrl ?? `${appUrl}/settings`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          {headerImageUrl
            ? (
                <Section style={s.headerSection}>
                  <Img
                    src={headerImageUrl}
                    width="600"
                    height="100"
                    alt={brandName}
                    style={s.headerImage}
                  />
                </Section>
              )
            : (
                <Section style={s.logoSection}>
                  <Img
                    src={`${appUrl}/apple-touch-icon.png`}
                    width="40"
                    height="40"
                    alt={brandName}
                    style={s.logoImage}
                  />
                </Section>
              )}

          <Section style={s.contentSection}>
            {children}

            <Hr style={s.divider} />

            <Text style={s.footerText}>
              You're receiving this because you signed up for
              {' '}
              {brandName}
              .
              {includePreferencesLink
                ? (
                    <>
                      {' '}
                      Update your email preferences in
                      {' '}
                      <a href={settingsHref} style={{ color: 'inherit' }}>
                        settings
                      </a>
                      .
                    </>
                  )
                : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({ children }: { children: ReactNode }) {
  return <Heading style={s.heading}>{children}</Heading>;
}

export function EmailText({ children }: { children: ReactNode }) {
  return <Text style={s.paragraph}>{children}</Text>;
}

export function EmailMutedText({ children }: { children: ReactNode }) {
  return <Text style={s.mutedText}>{children}</Text>;
}

export function EmailSignoff({ children }: { children: ReactNode }) {
  return <Text style={s.signoff}>{children}</Text>;
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={s.buttonSection}>
      <Button href={href} style={s.button}>
        {children}
      </Button>
    </Section>
  );
}

export function EmailSteps({ children }: { children: ReactNode }) {
  return <Section style={s.stepsSection}>{children}</Section>;
}

export function EmailStepItem({ children }: { children: ReactNode }) {
  return <Text style={s.stepItem}>{children}</Text>;
}

export function EmailFallbackLink({ href }: { href: string }) {
  return (
    <Text style={s.fallbackLink}>
      Or paste this link into your browser:
      {' '}
      <a href={href} style={{ color: s.colors.textMuted }}>
        {href}
      </a>
    </Text>
  );
}

export function EmailOtpCode({ code }: { code: string }) {
  return (
    <Section style={s.otpSection}>
      <Text style={s.otpCode}>{code}</Text>
    </Section>
  );
}
