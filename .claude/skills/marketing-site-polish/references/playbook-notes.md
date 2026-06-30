# Playbook Notes

Two halves: **standardized decisions** (don't re-litigate per project) and **concrete gotchas** (Claude won't infer these without painful re-discovery).

Pulled in by `SKILL.md` when a relevant code area gets touched or a relevant question gets raised. Don't load preemptively.

---

## Standardized decisions

These are choices already made across previous launches. Recommend them by default; only deviate when the user has a specific reason.

### Brand & typography

- **Em-dash as brand-name separator** (`—`, U+2014). Modern convention for "Brand — tagline" usage. Apple, Stripe, etc. do this. En-dash (`–`) is for numeric ranges; hyphen (`-`) reads dated. Apply in:
  - `<title>` separators (`Page Title — BrandName`)
  - `og:title` auto-suffix in `src/libs/seo/opengraph.ts`
  - Any locale `meta_title` strings using a separator
- **Title separator on apex landing:** use the em-dash directly in the locale `meta_title`. Don't rely on per-page suffix logic for the landing.

### Layout widths

- **`max-w-3xl`** for article body and any long-form prose page (About, Privacy, Terms). Reading-optimized line length.
- **`max-w-5xl`** for grid pages (blog index, category landing, dashboards). Lets cards breathe without becoming uncomfortably wide.
- **`max-w-2xl`** for hero lead paragraphs. Tight enough to read in one eye-sweep below a `text-5xl` headline.

### Navigation

- **Resources dropdown** via shadcn NavigationMenu when secondary nav surfaces reach ≥3 items (Blog + About + Changelog). Below that, keep flat nav links. Dropdown with 2 items reads as over-engineering.
- **Dropdown content pattern:** icon (lucide) + bold label + 1-line description per item. Keeps the dropdown scannable without forcing the user to click each to discover what's there.
- **Dropdown trigger styling:** override shadcn's default chunky button look. Use the same `text-sm font-medium text-muted-foreground hover:text-foreground` as flat nav links + add chevron. Without override, the trigger reads as a "button" in a row of "links" — inconsistent.
- **Right-grouped layout:** logo on far left; nav links + auth buttons grouped together on the right. Apple/Stripe/Linear convention. Avoids the cluttered "nav links in center, buttons on right" feel.
- **CTA primary copy:** "Start Free Trial" beats "Sign Up for Free" — shorter, more direct, implies value received not just an action.
- **Login button:** subtle outline pill (shadcn `variant="outline"` + `rounded-full px-5`). Visible enough to find, low enough weight to not compete with primary CTA.

### Footer

- **4 columns, in this order:** Product · Company · Legal · Compare. Legal next to copyright (closing trust signal). Compare last (named competitor links — SEO anchor text for tool-comparison queries).
- **Named competitor links** ("{YourProduct} vs {Competitor}") beat generic ones ("Comparisons"). Better SEO anchor text; faster path for users with specific tool questions.
- **No floating social icon cluster.** Roll social into the Company column under a "Social" subheading. Avoids the dead-space feel of a separate icon strip.
- **Drop the FAQ from footer** if it's already in the navbar. Don't repeat. The footer's job is "things not in the nav."

### Auth & routing

- **Landing-page redirect for unauth users**, not `/sign-in`. When a user hits a protected route while unauthenticated, redirect to landing with `?auth=signin&redirect=<original-path>` query params. The landing's `AuthDialogAutoOpener` reads these and opens the dialog. Benefits: cold visitors see product context first; the auth dialog is consistent across all entry points.
- **`/sign-in` and `/sign-up` pages still exist** as direct URLs (for password managers, email links, OAuth fallback). But every internal redirect uses the landing-dialog pattern.
- **Logout flow does NOT auto-open dialog.** After logout, redirect to bare `/` with no `?auth=` param. The user just chose to leave — pushing them back into sign-in is hostile.
- **`AuthDialogProvider` lives in `(unauth)/layout.tsx`, landing page lives inside `(unauth)/`.** These are paired — the layout doesn't wrap the landing unless the landing is in the same route group. Don't hoist the provider without relocating `page.tsx`.

### i18n

- **`localePrefix: 'as-needed'`** — default locale stays unprefixed (`/`, `/about`). Other locales get `/<locale>` prefix (`/hi`, `/hi/about`). Don't add `/en` prefix in redirect URLs that target the default locale.
- **Use `Link` from `@/libs/i18nNavigation`** (which wraps `next-intl/navigation`) for any internal link in shared components — navbar, footer, etc. Plain `next/link` loses the active locale when generating href.

### Content & SEO

- **`/blog` not `/articles`** for the SEO content route. "Blog" reads more familiar to most users.
- **Reading-optimized article hero matches About page hero.** Same `text-4xl sm:text-5xl tracking-tight` headline, same `text-lg text-muted-foreground` lead. Consistent typography across long-form content surfaces.
- **Article cards on index/category:** `rounded-xl bg-card`, group-hover lift (`group-hover:-translate-y-0.5 group-hover:shadow-lg`), arrow that nudges right on hover. Consistent across Blog index, Category page, and Related Posts at the bottom of articles.
- **Breadcrumbs on article pages, "← All posts" back-link on category pages.** Both improve nav clarity without cluttering the chrome.

---

## Concrete gotchas

Things that bit us before and will bite again. Surface to the user when the relevant area gets touched.

### pSEO dev-cache persists across requests

`src/libs/pseo/data.ts` keeps module-level `categoriesCache` and `pagesCache` variables. In production this is fine (each build is a fresh process). In dev with Turbopack HMR, these caches persist for the lifetime of the dev server process — adding/removing/renaming files under `content/blog/` won't reflect until the dev server restarts OR the `data.ts` file itself is edited.

**Mitigation:** add a `NODE_ENV !== 'production'` guard around cache reads and writes. ~5-line change. Or just restart the dev server when content changes don't reflect.

**Surface this to the user when:** they're adding/removing blog categories or report "I deleted the example article but it's still showing."

### Porkbun's "Create Email Forward" auto-tool deletes 3rd-party subdomain MX records

Porkbun's auto-DNS-fix flow scans the whole domain for MX records and flags anything not pointing at Porkbun as "3rd party unsupported" — **including subdomain MX used by Resend / Amazon SES for bounce handling**. Clicking OK on the warning popup will silently destroy your outbound email setup.

**Right pattern:**
1. Manually add Porkbun's MX values on the apex only: `fwd1.porkbun.com` priority 10, `fwd2.porkbun.com` priority 20.
2. Manually update apex SPF to include `_spf.porkbun.com` alongside existing apex senders. Do NOT include `amazonses.com` on apex SPF (it belongs only on the subdomain).
3. Then create the forwarding alias rule — popup may still appear; accept the risk and verify immediately after.
4. If subdomain records did get nuked, recover via Resend dashboard → Domains → "Verify DNS" — regenerates exact records to re-add.

**Surface this to the user when:** they're setting up email forwarding for the first time on a domain that already has Resend (or any other ESP) configured.

### Apex SPF and subdomain SPF have distinct purposes

SPF is checked against the envelope sender's domain, not the From: header. Resend's envelope sender is `<something>@send.mail.yourdomain.com` (the configured sending subdomain), so `amazonses.com` belongs on the SUBDOMAIN SPF, not apex.

Mixing them (`include:amazonses.com` on apex) authorizes any AWS SES customer to send `From: anything@yourdomain.com` that passes SPF. DMARC still saves you (DKIM alignment required), but it's poor hygiene.

**RFC 7208 rule:** only ONE SPF record per hostname. Multiple SPFs on the same hostname = many receiving servers treat the domain as having no valid SPF.

### `AuthDialogProvider` won't reach the landing page unless landing is inside `(unauth)/`

If you hoist `AuthDialogProvider` from the landing page to `(unauth)/layout.tsx` without also moving the landing page into the `(unauth)/` route group, the landing **silently** loses access to the provider. Buttons no-op (because `useAuthDialog()` returns the default no-op context). The `AuthDialogAutoOpener` calls `openSignUp()`/`openSignIn()` against the default context, and the dialog never opens.

Worse: this isn't caught by visual review (page renders fine, buttons look fine). Only E2E tests that wait for the dialog to appear will catch it.

**Pair the changes:** when moving the provider to the layout, also move `src/app/[locale]/page.tsx` → `src/app/[locale]/(unauth)/page.tsx`. Route groups don't affect URLs (`/` still routes there), but they DO affect which layout wraps the page.

### Hash anchors in shared nav need `/`-prefix and locale awareness

Two problems:

1. **Bare hash anchors** (`href="#pricing"`) only scroll if you're on the same page as the anchor. From `/blog`, clicking `#pricing` does nothing. Fix: use `/#pricing` so Next.js navigates to `/` first.
2. **Plain `next/link` strips locale.** From `/hi/blog`, clicking `<Link href="/#pricing">` navigates to `/#pricing` (English) — drops the user out of their locale. Fix: use `Link` from `@/libs/i18nNavigation` (re-export of `next-intl`'s locale-aware Link) instead of `next/link`.

### Semantic-release with branch protection requires app token or bypass

The default `GITHUB_TOKEN` in the release workflow cannot bypass branch protection rules — by design. When semantic-release tries to push the `chore(release): vX.Y.Z` commit (containing the updated `docs/CHANGELOG.md`), the push gets rejected.

**Two fixes:**
- Install the Semantic Release GitHub App, grant it bypass on protected branches, use its app token in the workflow (cleanest).
- OR generate a PAT from a bot account with bypass permission, store as repo secret, use that token.

**Wire this BEFORE enabling branch protection**, not after — otherwise the next release blocks immediately.

### Route renames need MDX content sed too

When renaming a route (e.g., `/articles` → `/blog`), the page templates and components get updated by editor edits, but **in-content links inside MDX files don't**. Codex review reliably flags broken `[link](/articles/foo)` references inside content files.

**Fix during the rename:** `find content/blog -name "*.mdx" -exec perl -i -pe 's{\]\(/articles/}{](/blog/}g' {} +` (use `perl -i` instead of `sed -i ''` — the BSD `sed -i ''` form fails on GNU sed in Linux CI/dev containers, silently leaving stale `](/articles/...)` links; `perl -i` is portable across macOS and Linux).

### Formatter race in PostToolUse hooks

When a project has a `PostToolUse:Edit` hook that runs `eslint --fix` automatically:

1. Edit #1 adds a new import (`import { Newspaper } from 'lucide-react'`)
2. **Hook runs** between Edit #1 and Edit #2
3. Hook sees `Newspaper` is imported but not yet used → removes it as "unused"
4. Edit #2 adds the JSX that uses `Newspaper` → ReferenceError at runtime

**Mitigation:** always batch import + usage in a single Edit or Write call when introducing a new import. Avoid the two-step "add import, then use it" pattern.

**Environmental fix** (if user wants): remove the PostToolUse formatter hook entirely; rely on pre-commit lint-staged to catch unused imports at commit time. (This is project-config territory, not skill territory.)
