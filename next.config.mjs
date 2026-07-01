import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import createJiti from 'jiti';
import withNextIntl from 'next-intl/plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = createJiti(fileURLToPath(import.meta.url));

jiti('./src/libs/Env');

const withNextIntlConfig = withNextIntl('./src/libs/i18n.ts');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// CSP in Report-Only mode: it collects violations in the browser console
// WITHOUT enforcing, so nothing in the UI can break. Inline scripts/eval from
// your integrations require a soak before enforcing — watch the console (and
// Sentry) for report-only violations, tighten the allowlist below, then flip to
// an enforcing `Content-Security-Policy` header in a follow-up. Only the
// template's actual integrations are allowlisted; add hosts as you adopt them.
const cspReportOnly = [
  'default-src \'self\'',
  // 'unsafe-inline'/'unsafe-eval' are broad on purpose during the soak — narrow
  // (e.g. to nonces/hashes) before you enforce.
  'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://*.stripe.com https://js.stripe.com https://*.posthog.com https://*.sentry.io',
  'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com',
  'img-src \'self\' data: blob: https:',
  'font-src \'self\' data: https://fonts.gstatic.com',
  'connect-src \'self\' https://*.supabase.co wss://*.supabase.co https://*.stripe.com https://*.posthog.com https://*.sentry.io',
  'frame-src \'self\' https://*.stripe.com https://js.stripe.com',
  'frame-ancestors \'none\'',
  'base-uri \'self\'',
  'form-action \'self\' https://*.stripe.com',
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspReportOnly,
  },
];

/** @type {import('next').NextConfig} */
export default withSentryConfig(
  bundleAnalyzer(
    withNextIntlConfig({
      turbopack: {
        root: __dirname,
      },
      poweredByHeader: false,
      reactStrictMode: true,
      serverExternalPackages: ['@electric-sql/pglite'],
      async headers() {
        return [
          {
            source: '/(.*)',
            headers: securityHeaders,
          },
        ];
      },
    }),
  ),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Disable Sentry telemetry
    telemetry: false,

    // Associate commits with each release so a commit message containing
    // "Fixes <ISSUE-ID>" auto-resolves that Sentry issue on deploy.
    // Requires the Sentry GitHub integration to be connected. ignoreMissing/
    // ignoreEmpty keep the build green if commit detection can't run.
    release: {
      setCommits: {
        auto: true,
        ignoreMissing: true,
        ignoreEmpty: true,
      },
    },
  },
);
