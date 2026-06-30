export const colors = {
  primary: '#2563eb',
  bodyBg: '#f8fafc',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#1e293b',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
} as const;

export const fontStack
  = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';

export const main = {
  backgroundColor: colors.bodyBg,
  fontFamily: fontStack,
  margin: '0 auto',
  padding: '20px 0',
};

// Card spans 600px max with no padding — the header image goes edge-to-edge,
// and a separate `contentSection` provides the inner 40×48 padding for body
// copy. Image's top corners are rounded to match the card; Outlook desktop
// may show them squared, which is acceptable degradation.
export const container = {
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '0',
  overflow: 'hidden' as const,
};

export const headerSection = {
  margin: '0',
  padding: '0',
  fontSize: '0',
  lineHeight: '0',
};

export const headerImage = {
  display: 'block',
  width: '100%',
  height: 'auto' as const,
  margin: '0',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
};

// Centered logo fallback used when no full-bleed header image is supplied.
export const logoSection = {
  textAlign: 'center' as const,
  padding: '32px 0 0',
};

export const logoImage = {
  margin: '0 auto',
};

export const contentSection = {
  padding: '40px 48px',
};

export const heading = {
  color: colors.textPrimary,
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
};

export const paragraph = {
  color: colors.textPrimary,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

export const stepsSection = {
  backgroundColor: colors.bodyBg,
  borderRadius: '8px',
  margin: '24px 0',
  padding: '20px 24px',
};

export const stepItem = {
  color: colors.textPrimary,
  fontSize: '16px',
  lineHeight: '28px',
  margin: '0',
};

export const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

export const button = {
  backgroundColor: colors.primary,
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

export const divider = {
  borderColor: colors.border,
  margin: '24px 0',
};

export const signoff = {
  color: colors.textPrimary,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

export const mutedText = {
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

export const fallbackLink = {
  color: colors.textMuted,
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 16px',
  wordBreak: 'break-all' as const,
};

export const footerText = {
  color: colors.textFaint,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};

export const otpSection = {
  backgroundColor: colors.bodyBg,
  borderRadius: '8px',
  margin: '24px 0',
  padding: '24px',
  textAlign: 'center' as const,
};

export const otpCode = {
  color: colors.textPrimary,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '0.15em',
  lineHeight: '1',
  margin: '0',
};
