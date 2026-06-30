# Pre-Launch External-System Checklist

External-system steps that aren't in the codebase but block a clean launch. Walk through these with the user when they reach the pre-launch phase. Order matters loosely — email forwarding before legal review (so legal contact emails actually work); branch protection before first prod release.

---

## 1. Email forwarding for `hello@yourdomain.com`

**Why it matters:** Privacy + Terms pages reference a contact email for GDPR / data-deletion / support. Stripe requires a privacy URL with a working contact. Without forwarding, those emails bounce.

**Recommended setup** (~5 min):

- **Domain on Cloudflare DNS:** use [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) (free).
- **Domain on Porkbun:** use Porkbun's free Email Forwarding. **Important:** see the Porkbun + ESP coexistence gotcha in `playbook-notes.md` if the project already has an ESP (Resend / SES / etc.) configured on a subdomain.
- **Domain elsewhere (Namecheap, GoDaddy, etc.):** check if registrar has built-in forwarding; otherwise use ImprovMX (free up to 25 aliases).

**Steps (Porkbun):**
1. Domain Management → Email Hosting and Forwarding for the domain.
2. **Don't click the "Fix DNS" auto-tool** if Resend / SES is already configured — it'll delete subdomain MX records. Manually add Porkbun MX on apex instead: `fwd1.porkbun.com` priority 10, `fwd2.porkbun.com` priority 20. Add Porkbun's SPF mechanism (`include:_spf.porkbun.com`) to the existing apex SPF (don't create a second SPF — RFC 7208 forbids).
3. Add the forward alias: `hello` → personal inbox.
4. Test: send from personal Gmail → `hello@yourdomain.com`. Should arrive within ~1 min.

**Verify both directions** if the project sends outbound:
- Inbound: external → `hello@yourdomain.com` arrives in your inbox
- Outbound: trigger any transactional from the app → arrives via ESP

---

## 2. Branch protection on `main` + Semantic Release GitHub App

**Why it matters:** Without branch protection, the team (or you, accidentally) can push directly to main. With branch protection enabled BUT no app token configured, the semantic-release workflow can't push the `chore(release): vX.Y.Z` commit that updates `docs/CHANGELOG.md` → releases break silently.

**Wire BOTH at the same time:**

1. **Install [Semantic Release GitHub App](https://github.com/apps/semantic-release-bot)** on the repo. Grant minimum permissions.
2. **GitHub repo Settings → Branches → Branch protection rule for `main`:**
   - Require pull request before merging
   - Require status checks (CI, tests)
   - **Allow specified actors to bypass:** add the Semantic Release App
3. **Update `.github/workflows/release.yml`** to use the app's token via `actions/create-github-app-token@v2` instead of the default `GITHUB_TOKEN`.

**Alternative (simpler but less clean):** use a PAT from your account with `contents: write`, save as `SEMANTIC_RELEASE_TOKEN` repo secret, add yourself to the bypass list.

**Test:** merge a `feat:` commit to main. Verify:
- GitHub release created
- `chore(release): vX.Y.Z` commit pushed to main with `docs/CHANGELOG.md` updated
- The `/changelog` page renders the new entry on next deploy

---

## 3. Legal review (Privacy + Terms)

**Why it matters:** AI-drafted templates are a starting point, not a finish line. Governing law, refund policy, AI disclaimers, jurisdiction-specific compliance (GDPR, CCPA, India PDPB) — these need human review or a regulation-tracking service.

**Options (pick one):**

| Option | Cost | Best for |
|---|---|---|
| [Termly](https://termly.io/) | $10–30/mo | Indie SaaS; auto-updates with regulation changes; reviewable templates |
| [Iubenda](https://www.iubenda.com/) | $30/year | Tightest defaults for EU; embeddable widget or copy-paste |
| [GetTerms](https://getterms.io/) | Free tier | Quick baseline; no auto-update |
| Lawyer | $300–500 one-time | Strong defensibility; for founded companies taking EU/US enterprise customers |

**Steps:**

1. Pick a service or counsel.
2. Feed the existing draft `src/app/[locale]/(unauth)/privacy/page.tsx` + `terms/page.tsx` into it. Adjust based on output.
3. **Required updates regardless of service:**
   - Governing law (currently placeholder, e.g., `India`)
   - Effective date (currently a fixed string — update to launch date)
   - Company name / legal entity (currently bare brand name)
   - Refund policy details (currently generic "case-by-case")
   - Cookie banner if EU traffic expected (separate question — see #7)
4. Replace `page.tsx` content with reviewed text. Keep the page chrome (Navbar/Footer wrapper) intact.

---

## 4. Product screenshots on landing

**Why it matters:** Mock placeholders in the Hero / HowItWorks / Differentiators sections read as "demo not yet built." Real product screenshots increase trust signal materially.

**What to capture** (5 shots covers most landings):

1. The primary input flow (e.g., ideation textbox + generated drafts)
2. The editor / main work surface
3. Scheduling / management view
4. Any unique differentiator (e.g., style customization, integration view)
5. Mobile or alternate-channel view if the product supports it

**Specs:**
- **PNG** (not JPG — sharper for UI screenshots)
- **2400×1500** (retina-friendly; Next.js Image downscales crisply)
- Save under `public/landing/` with clear names
- **Anonymous but realistic content** — fake user, generic but plausible data
- Strip browser chrome (no URL bar, no tabs)
- Optional: add a subtle border-radius + drop shadow in a tool like Figma so they look like "polished frames" rather than raw captures

**Tools:** macOS Cmd+Shift+5 or [CleanShot](https://cleanshot.com/) for high-quality screenshots.

---

## 5. DMARC policy progression

**Why it matters:** Starting at `p=none` is correct for safety, but it provides no enforcement. Once delivery is verified for a few weeks, ratchet up to `p=quarantine` (suspicious mail goes to spam) and eventually `p=reject` (failing mail bounces). Gmail and Yahoo require this for bulk senders since Feb 2024.

**Progression:**

1. **Launch:** `p=none` with `rua=mailto:dmarc-reports@yourdomain.com` (or use a free aggregator like [Postmark DMARC](https://dmarc.postmarkapp.com/)).
2. **Week 2-4:** review the aggregate reports. Confirm all legitimate senders (your ESP, any third-party tools) are aligned. Fix any failures.
3. **Month 1-3:** move to `p=quarantine` with `pct=25` (apply policy to 25% of failing mail). Watch for issues.
4. **Month 3+:** ratchet to `p=quarantine pct=100`, then `p=reject` when confident.

**TXT record** at `_dmarc.yourdomain.com`:
```
v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; fo=1
```

---

## 6. OG image generation (per-page vs static)

**Why it matters:** A single static `/og-image.png` works for the landing share but reads generic when articles get shared (every comparison post shows the same image). Per-article OG images using `next/og` or `@vercel/og` materially improve LinkedIn / Twitter CTR.

**Decision matrix:**

- **Low article volume + manual sharing:** static `/og-image.png` is fine. Don't over-engineer.
- **>10 articles + active distribution:** wire `/api/og` route with `next/og` ImageResponse. Pass article title + category as query params. Reference in article `generateMetadata`.

**For launch:** static is usually fine. File a GitHub issue to revisit once article volume + share traffic justifies the work.

---

## 7. Search Console verification + sitemap submission

**Why it matters:** Google won't index the site quickly without explicit submission, and you won't see indexing health without verifying ownership.

**Steps:**

1. [Google Search Console](https://search.google.com/search-console) → Add property → domain or URL prefix.
2. Verify via DNS TXT record (already present in template's setup script, usually).
3. Submit sitemap: `https://yourdomain.com/sitemap.xml`.
4. Use the URL Inspection tool to request indexing of the landing + key article pages.
5. Optional but valuable: also submit to [Bing Webmaster Tools](https://www.bing.com/webmasters/) (Bing powers DuckDuckGo and Ecosia too).

**Verify after a few days:**
- Coverage report shows pages indexed
- Sitemap shows successful read
- No crawl errors on key URLs

---

## 8. Cookie banner (conditional)

**Why it matters:** GDPR / ePrivacy require consent for non-essential cookies in EU/UK. If you run any analytics or marketing pixels and expect any EU traffic, you need this.

**Defer if:**
- Day-1 launch is targeted at non-EU (US-only beta, etc.)
- No analytics beyond strictly-necessary (auth session cookies only)

**Set up if:**
- Running PostHog, GA, Mixpanel, etc. AND expect EU/UK users
- Running paid ads in EU/UK (compliance requirement)
- Targeting enterprise customers who'll audit privacy posture

**Recommended:** [react-cookie-consent](https://github.com/Mastermindzh/react-cookie-consent) for a quick implementation; [CookieYes](https://www.cookieyes.com/) for a managed service with auto-scanning.

---

## Pre-launch readiness gate (final checklist)

Before announcing "we're live":

- [ ] Email forwarding works (inbound + outbound verified)
- [ ] Branch protection on; semantic-release App can push CHANGELOG commits
- [ ] Privacy + Terms reviewed and live
- [ ] About page customized (not template default)
- [ ] All footer + nav links return 200 (no 404s)
- [ ] Sitemap + robots accessible at `/sitemap.xml` and `/robots.txt`
- [ ] Search Console verified, sitemap submitted
- [ ] OG image / share preview tested (LinkedIn Post Inspector, Twitter Card Validator)
- [ ] Login / Sign Up dialog opens from every unauth page (not just landing)
- [ ] DMARC at minimum `p=none` with `rua` reporting address
- [ ] 404 page on-brand (not Next.js default)
