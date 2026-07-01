# Legal review — before you ship

The `/terms` and `/privacy` pages shipped with this template are an
**AI-drafted starting point, not legal advice.** They cover the common-SaaS
clauses grounded in this template's stack (Supabase, an OAuth provider, Stripe,
Resend, PostHog, Sentry), but they are generic placeholders. Have a lawyer or a
policy generator review and adapt them to your business, jurisdiction, and data
practices **before you accept real users or payments.**

## What to customize first

All legal placeholders live in one place — `src/config/site-config.ts`, under
the `legal` key. Edit them there; the pages read from config, nothing is
hardcoded:

- `companyLegalName` — your registered legal entity name
- `governingLaw` — the jurisdiction whose laws govern your terms
- `effectiveDate` — the ISO date the policies take effect (drives the
  "Effective / Last updated" header)
- `supportEmail` — the contact address for legal and privacy requests

Then review the clause prose in:

- `src/app/[locale]/(unauth)/(marketing)/terms/page.tsx`
- `src/app/[locale]/(unauth)/(marketing)/privacy/page.tsx`

## Get real, reviewed policies

Pick one of these paths before launch:

- **Policy generators** (fast, low cost, good default for solo founders):
  - [Termly](https://termly.io) — generators + a cookie consent banner
  - [Iubenda](https://www.iubenda.com) — generators with GDPR/CCPA modules
  - [GetTerms](https://getterms.io), [Termageddon](https://termageddon.com) —
    alternatives with ongoing update coverage
- **A lawyer** (recommended once you handle sensitive data, operate in
  regulated markets, or take meaningful revenue): have counsel draft or review
  your Terms of Service and Privacy Policy for your specific data flows and
  jurisdictions.

## Sub-processor checklist

List every third party that processes user data in your Privacy Policy. For
this template's default stack that typically means: Supabase (auth + Postgres),
your OAuth provider(s), Stripe (payments), Resend (email), PostHog (analytics),
and Sentry (error monitoring). Add or remove entries to match what you actually
enable, and confirm each provider's Data Processing Agreement (DPA) is in place.

## Compliance reminders

- **Cookies / consent:** if you serve the EU/UK, add a consent banner and gate
  non-essential analytics behind consent.
- **Data-subject rights:** make sure your support flow can honor access,
  export, and deletion requests within legal timeframes.
- **Keep dates current:** bump `effectiveDate` in `site-config.ts` whenever you
  materially change the policies.
