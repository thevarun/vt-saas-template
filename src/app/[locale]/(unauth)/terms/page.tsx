import { AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

import { LegalTableOfContents } from '@/components/legal/legal-toc';
import { SITE_CONFIG } from '@/config/site-config';
import { getSiteUrl } from '@/libs/seo/config';
import { generateHreflangLinks } from '@/libs/seo/hreflang';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';

const PATH = '/terms';
const TITLE = 'Terms of Service';
const DESCRIPTION = `The terms governing your use of ${SITE_CONFIG.brand.name}.`;

const SECTIONS = [
  { id: 'acceptance', label: 'Acceptance of terms' },
  { id: 'accounts', label: 'Accounts and eligibility' },
  { id: 'payments', label: 'Subscriptions and payments' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'third-party', label: 'Third-party processors' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'termination', label: 'Termination' },
  { id: 'disclaimers', label: 'Disclaimers and liability' },
  { id: 'governing-law', label: 'Governing law' },
  { id: 'contact', label: 'Contact' },
] as const;

export async function generateMetadata(): Promise<Metadata> {
  // Single authoritative canonical (default-locale, unprefixed) for every
  // locale variant; hreflang alternates signal the multilingual relationship
  // without splitting canonical authority. Mirrors the /about pattern.
  const languages = generateHreflangLinks(PATH).reduce(
    (acc, link) => {
      acc[link.hreflang] = link.href;
      return acc;
    },
    {} as Record<string, string>,
  );

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

export default async function TermsPage(props: {
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

  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          {/* AI-drafted disclaimer banner */}
          <div className="not-prose mb-10 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
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

          <article className="prose prose-neutral max-w-none dark:prose-invert">
            <p>
              These Terms of Service (the &ldquo;Terms&rdquo;) govern your access
              to and use of the services, websites, and applications provided by
              {' '}
              {companyLegalName}
              {' '}
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;
              {SITE_CONFIG.brand.name}
              &rdquo;). By using our service, you agree to these Terms.
            </p>

            <h2 id="acceptance">1. Acceptance of terms</h2>
            <p>
              By accessing or using the service, you confirm that you have read,
              understood, and agree to be bound by these Terms and our Privacy
              Policy. If you do not agree, you may not use the service. We may
              update these Terms from time to time; continued use after changes
              take effect constitutes acceptance of the revised Terms.
            </p>

            <h2 id="accounts">2. Accounts and eligibility</h2>
            <p>
              You must be at least the age of majority in your jurisdiction to
              create an account. Authentication is handled through our identity
              provider, and you are responsible for maintaining the
              confidentiality of your credentials and for all activity under your
              account. Notify us promptly of any unauthorized use.
            </p>

            <h2 id="payments">3. Subscriptions and payments</h2>
            <p>
              Paid plans are billed on a recurring basis through our payment
              processor. By subscribing, you authorize us to charge the
              applicable fees to your chosen payment method until you cancel.
              Fees are non-refundable except where required by law. We may change
              pricing with reasonable notice; changes apply to the next billing
              cycle. You can cancel at any time, and access continues until the
              end of the current paid period.
            </p>

            <h2 id="acceptable-use">4. Acceptable use</h2>
            <p>
              You agree not to misuse the service, including by attempting to
              access it through unauthorized means, disrupting its integrity or
              performance, reverse-engineering it, or using it to store or
              transmit unlawful, infringing, or harmful content. We may suspend
              or restrict access to protect the service and its users.
            </p>

            <h2 id="third-party">5. Third-party processors</h2>
            <p>
              We rely on trusted third-party providers to operate the service —
              for example, infrastructure and database hosting, authentication,
              payment processing, transactional email, product analytics, and
              error monitoring. These providers process data on our behalf under
              their own terms and safeguards. Their use is described further in
              our Privacy Policy.
            </p>

            <h2 id="ip">6. Intellectual property</h2>
            <p>
              The service, including its software, design, and content we
              provide, is owned by
              {' '}
              {companyLegalName}
              {' '}
              and protected by intellectual-property laws. You retain ownership
              of content you submit and grant us a limited license to host and
              process it solely to provide the service.
            </p>

            <h2 id="termination">7. Termination</h2>
            <p>
              You may stop using the service and delete your account at any time.
              We may suspend or terminate access if you breach these Terms or if
              required to protect the service, other users, or comply with law.
              Provisions that by their nature should survive termination will
              survive.
            </p>

            <h2 id="disclaimers">8. Disclaimers and liability</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; without warranties of
              any kind, to the fullest extent permitted by law. To the maximum
              extent permitted by law, we are not liable for indirect,
              incidental, or consequential damages, and our aggregate liability
              is limited to the amounts you paid us in the twelve months
              preceding the claim.
            </p>

            <h2 id="governing-law">9. Governing law</h2>
            <p>
              These Terms are governed by the laws of
              {' '}
              {governingLaw}
              , without regard to its conflict-of-laws rules. Any disputes will
              be resolved in the courts located there, unless otherwise required
              by applicable law.
            </p>

            <h2 id="contact">10. Contact</h2>
            <p>
              Questions about these Terms? Reach us at
              {' '}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              .
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </>
  );
}
