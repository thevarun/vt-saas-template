import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

import { LegalTableOfContents } from '@/components/legal/legal-toc';
import { isDarkTheme } from '@/components/theme/theme-config';
import { SITE_CONFIG } from '@/config/site-config';
import { Container } from '@/features/landing/Container';
import { getSiteUrl } from '@/libs/seo/config';
import { generateHreflangAlternates } from '@/libs/seo/hreflang';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { cn } from '@/utils/Helpers';

const PATH = '/privacy';
const TITLE = 'Privacy Policy';
const DESCRIPTION = `How ${SITE_CONFIG.brand.name} collects, uses, and protects your data.`;

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-we-collect', label: 'Data we collect' },
  { id: 'how-we-use', label: 'How we use your data' },
  { id: 'processors', label: 'Third-party processors' },
  { id: 'cookies', label: 'Cookies and analytics' },
  { id: 'retention', label: 'Data retention' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'security', label: 'Security' },
  { id: 'governing-law', label: 'Governing law' },
  { id: 'contact', label: 'Contact' },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  // Single authoritative canonical (default-locale, unprefixed) for every
  // locale variant; hreflang alternates signal the multilingual relationship
  // without splitting canonical authority. Mirrors the /about pattern.
  const languages = generateHreflangAlternates(PATH);

  return {
    title: TITLE,
    description: DESCRIPTION,
    ...generateSocialMetadata({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
    }),
    alternates: {
      canonical: `${getSiteUrl()}${PATH}`,
      languages,
    },
  };
}

export default async function PrivacyPage(props: {
  params: Promise<{ locale: string }>;
}) {
  await props.params;

  const { companyLegalName, governingLaw, effectiveDate, supportEmail }
    = SITE_CONFIG.legal;
  const effective = new Date(effectiveDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Marketing pages are theme-scoped by the (marketing) layout, INDEPENDENT of
  // the app's `<html>` theme. Drive dark styling off the marketing theme config
  // (not Tailwind's ancestor-based `dark:`), which would otherwise fire off an
  // OS-dark visitor's `<html class="dark">` and invert this light page.
  const marketingDark = isDarkTheme(SITE_CONFIG.marketingTheme);

  return (
    <section className="relative overflow-hidden pb-20 pt-12">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <Container size="md" className="relative">
        {/* AI-drafted disclaimer banner */}
        <div className={cn('not-prose mb-10 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900', marketingDark && 'text-amber-200')}>
          <AlertTriangle
            className={cn('mt-0.5 size-5 shrink-0 text-amber-600', marketingDark && 'text-amber-400')}
            aria-hidden
          />
          <p>
            <strong className="font-semibold">AI-drafted starting point</strong>
            {' '}
            — not legal advice; have a lawyer or a policy generator review this
            before you ship.
          </p>
        </div>

        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {TITLE}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Effective
            {' '}
            {effective}
            {' '}
            · Last updated
            {' '}
            {effective}
          </p>
        </header>

        <LegalTableOfContents sections={[...SECTIONS]} className="mb-12" />

        <article className={cn('prose prose-neutral max-w-none', marketingDark && 'prose-invert')}>
          <p>
            This Privacy Policy explains how
            {' '}
            {companyLegalName}
            {' '}
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;
            {SITE_CONFIG.brand.name}
            &rdquo;) collects, uses, and protects your personal data when you
            use our service.
          </p>

          <h2 id="overview">1. Overview</h2>
          <p>
            We collect only the data we need to provide and improve the service,
            and we are transparent about how it is used. We do not sell your
            personal data. Where required, we process data under a lawful basis
            such as consent, contract, or legitimate interest.
          </p>

          <h2 id="data-we-collect">2. Data we collect</h2>
          <p>
            We collect account data you provide (such as your email and profile
            details), authentication identifiers, billing information handled by
            our payment processor, and product-usage and diagnostic data
            generated as you interact with the service.
          </p>

          <h2 id="how-we-use">3. How we use your data</h2>
          <p>
            We use your data to operate and secure your account, process
            payments, provide support, send transactional messages, understand
            product usage, and diagnose and fix issues. We use aggregated,
            de-identified data to improve the service.
          </p>

          <h2 id="processors">4. Third-party processors</h2>
          <p>
            We share data with sub-processors who help us run the service, each
            under contractual data-protection obligations. These typically
            include database and infrastructure hosting, an authentication
            provider (including optional OAuth sign-in), a payment processor, a
            transactional email provider, a product-analytics platform, and an
            error-monitoring service. We share only what each provider needs to
            perform its function.
          </p>

          <h2 id="cookies">5. Cookies and analytics</h2>
          <p>
            We use cookies and similar technologies for essential functionality
            (such as keeping you signed in) and, where permitted, for product
            analytics. Analytics help us understand feature usage and improve
            the experience. You can control non-essential cookies through your
            browser settings or any consent controls we provide.
          </p>

          <h2 id="retention">6. Data retention</h2>
          <p>
            We retain personal data for as long as your account is active or as
            needed to provide the service, comply with legal obligations,
            resolve disputes, and enforce agreements. When data is no longer
            needed, we delete or anonymize it.
          </p>

          <h2 id="your-rights">7. Your rights</h2>
          <p>
            Depending on your location, you may have the right to access,
            correct, export, or delete your personal data, and to object to or
            restrict certain processing. You can exercise these rights by
            contacting us; we will respond within the timeframe required by
            applicable law.
          </p>

          <h2 id="security">8. Security</h2>
          <p>
            We use industry-standard technical and organizational measures to
            protect your data, including encryption in transit, access controls,
            and provider-level safeguards. No system is perfectly secure, but we
            work to protect your information and to notify you of incidents
            where required by law.
          </p>

          <h2 id="governing-law">9. Governing law</h2>
          <p>
            This Privacy Policy is governed by the laws of
            {' '}
            {governingLaw}
            ,
            without regard to its conflict-of-laws rules, except where
            overridden by data-protection laws applicable to you.
          </p>

          <h2 id="contact">10. Contact</h2>
          <p>
            Questions or requests about your privacy? Reach us at
            {' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            .
          </p>
        </article>
      </Container>
    </section>
  );
}
