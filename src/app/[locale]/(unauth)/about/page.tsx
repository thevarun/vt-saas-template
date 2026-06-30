import { Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Fragment } from 'react';

import { Reveal } from '@/components/reveal';
import { LinkedInIcon } from '@/components/share/platformIcons';
import { getSiteUrl } from '@/libs/seo/config';
import { generateHreflangLinks } from '@/libs/seo/hreflang';
import { generateSocialMetadata } from '@/libs/seo/opengraph';
import { Footer } from '@/templates/Footer';
import { Navbar } from '@/templates/Navbar';

import { ABOUT_CONTENT } from './about-content';

const PATH = '/about';
const TITLE = 'About';
const DESCRIPTION = `Meet ${ABOUT_CONTENT.founderName}, the founder.`;

/** Maps a social label to its brand glyph. Extend as more socials are added. */
const SOCIAL_ICONS: Record<string, typeof LinkedInIcon> = {
  LinkedIn: LinkedInIcon,
};

export async function generateMetadata(): Promise<Metadata> {
  // Single authoritative canonical (default-locale, unprefixed) for every
  // locale variant; hreflang alternates signal the multilingual relationship
  // without splitting canonical authority. Mirrors the root layout pattern.
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

export default async function AboutPage(props: {
  params: Promise<{ locale: string }>;
}) {
  await props.params;

  const {
    eyebrow,
    headline,
    founderName,
    founderRole,
    founderImage,
    bio,
    quote,
    quoteAttribution,
    email,
    socials,
  } = ABOUT_CONTENT;

  const headlineLines = headline.split('\n');

  return (
    <>
      <Navbar />

      {/* Founder hero */}
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-[280px] w-[280px] rounded-full bg-accent/40 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {headlineLines.map((line, index) => (
              // Composite key stays unique even if two headline lines are
              // identical; the static config never reorders, so the index is safe.
              // eslint-disable-next-line react/no-array-index-key -- static headline lines, never reordered; index pairs with text to avoid duplicate-key collisions
              <Fragment key={`${index}-${line}`}>
                {index > 0 ? <br className="hidden sm:block" /> : null}
                {line}
              </Fragment>
            ))}
          </h1>

          {/* Founder card */}
          <div className="mt-24 flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-linear-to-br from-primary to-accent opacity-70 blur-md" />
              <Image
                src={founderImage}
                alt={`${founderName}, founder`}
                width={144}
                height={144}
                className="relative size-36 rounded-full object-cover ring-4 ring-card"
                priority
              />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">
              {founderName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {founderRole}
            </p>

            {/* Icon socials */}
            <div className="mt-4 flex items-center gap-3">
              {socials.map(({ href, label }) => {
                const Icon = SOCIAL_ICONS[label];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {Icon ? <Icon className="size-[18px]" /> : label}
                  </a>
                );
              })}
              <a
                href={`mailto:${email}`}
                aria-label="Email"
                className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail size={18} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Founder bio */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {bio}
          </p>

          <figure className="mt-12">
            <span aria-hidden className="block text-7xl leading-none text-primary/25">&ldquo;</span>
            <blockquote className="-mt-6 text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
              {quote}
            </blockquote>
            <figcaption className="mt-5 text-sm font-semibold text-muted-foreground">
              &mdash;
              {' '}
              {quoteAttribution}
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
