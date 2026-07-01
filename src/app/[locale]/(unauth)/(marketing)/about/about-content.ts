/**
 * Editable copy for the /about founder page.
 *
 * Everything the page renders lives here so a fork can re-skin /about by
 * editing this one file — never the markup. The defaults below are deliberately
 * generic placeholders: swap the founder details, bio, quote, photo (replace
 * `public/founder.jpg` in place), email, and socials for your own product
 * before going live.
 */

export type AboutSocial = {
  label: string;
  href: string;
};

export type AboutContent = {
  /** Small uppercase label above the headline. */
  eyebrow: string;
  /** Hero headline (supports a soft line break on `\n`). */
  headline: string;
  /** Founder display name. */
  founderName: string;
  /** Founder role/title line under the name. */
  founderRole: string;
  /** Path to the founder photo served from `public/`. */
  founderImage: string;
  /** Bio paragraph. */
  bio: string;
  /** Pull-quote shown beneath the bio. */
  quote: string;
  /** Attribution for the quote. */
  quoteAttribution: string;
  /** Contact email used for the mailto link. */
  email: string;
  /** Social profile links rendered as icon buttons. */
  socials: AboutSocial[];
};

export const ABOUT_CONTENT: AboutContent = {
  eyebrow: 'About',
  headline:
    'A small company. Okay, very small.\nOkay fine — it’s mostly just Varun.',
  founderName: 'Varun Torka',
  founderRole: 'Product, Engineering, Growth, Support, Catering',
  founderImage: '/founder.jpg',
  bio: 'Varun is a product leader turned solopreneur. Previously, after studying at IIT Delhi and IIM Calcutta, he spent 13+ years building products in the corporate world — from NetApp to Grab — across both individual-contributor and leadership roles. These days, he’s using AI to design, build, and ship software end to end.',
  quote:
    'I built this because I wanted something like it for myself. Most tools are made for full-time creators; this is for the other 95% — people with something worth saying but no time to polish a content calendar.',
  quoteAttribution: 'Varun',
  email: 'hello@example.com',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/thevarun' },
  ],
};
