import type { Metadata } from 'next';

import { SITE_CONFIG } from '@/config/site-config';

/**
 * Demo page for the opt-in marketing shell.
 *
 * Neutral placeholder sections (hero + a couple of generic sections) so a fork
 * can see `MarketingNavbar` + `MarketingFooter` rendered end-to-end. Replace
 * with real marketing content once the shell is adopted.
 */

export const metadata: Metadata = {
  title: 'Marketing shell demo',
  description: 'Preview of the opt-in, brand-config-driven marketing shell.',
  robots: { index: false, follow: false },
};

const features = [
  { title: 'Placeholder feature one', body: 'Describe a core benefit here.' },
  { title: 'Placeholder feature two', body: 'Describe another benefit here.' },
  { title: 'Placeholder feature three', body: 'Describe a third benefit here.' },
];

export default function MarketingDemoPage() {
  const { brand } = SITE_CONFIG;

  return (
    <>
      {/* Hero */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {brand.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {brand.tagline}
        </p>
      </section>

      {/* Generic feature grid */}
      <section className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            What you get
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {features.map(f => (
              <div key={f.title} className="rounded-lg border border-border bg-background p-6">
                <h3 className="text-base font-medium text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing anchor placeholder */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold text-foreground">Simple pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Drop your pricing table here. This section is a neutral placeholder.
          </p>
        </div>
      </section>
    </>
  );
}
