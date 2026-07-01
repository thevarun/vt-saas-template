# Vercel

**Purpose in this codebase**: Hosting + serverless functions + CDN + Git-triggered deploys + per-env env vars.
**Used for**: all production and preview deployments via Git integration.
**Tool**: Vercel CLI + Vercel MCP (preferred) → dashboard (last resort).
**Dependency group**: A (infra) — required before OAuth / webhooks can resolve to production URLs.
**Last updated**: 2026-04-21

---

## Project-specific conventions

- **Single Vercel project for all environments** (prod + preview + dev) with env vars scoped per env — not separate projects.
- **On-demand spend cap** set immediately after project creation. Default: $200/mo for alpha/beta.
- Root directory auto-detected by Next.js App Router convention.
- Deployment Protection is **on** by default for new projects — Inngest + webhook integrations need a bypass key configured.

---

## Setup during first prod deploy

### Sub-steps (track each in state file)

1. **Tool audit**: `vercel --version` + `vercel whoami` succeed.
2. **Green local build gate**: `pnpm install --frozen-lockfile && pnpm build && pnpm check-types && pnpm lint` all pass. Do NOT create Vercel project on a red local build.
3. **Node/TS version alignment**: compare `package.json` engines + `typescript` version to Vercel's current default (via context7 `/vercel/next.js` or WebFetch of [Node.js versions on Vercel](https://vercel.com/docs/functions/runtimes/node-js)). Pin both.
4. **Domain ownership check**: confirm with user. If fresh domain, run Google Safe Browsing lookup before OAuth work.
5. **Link project**: `vercel link --yes` from repo root.
6. **Confirm framework detection**: Next.js App Router.
7. **Add domain**: `vercel domains add {PRODUCTION_DOMAIN}` (or MCP equivalent).
8. **DNS records at registrar**:
   - `A @ 76.76.21.21`
   - `CNAME www cname.vercel-dns.com`
   (Verify exact current values via context7 `/vercel/vercel` — Vercel's anycast IP occasionally changes.)
9. **Wait for SSL**: Vercel auto-issues; confirm `https://{PRODUCTION_DOMAIN}` returns 200.
10. **Apply env vars per Phase 3 plan**:
    ```bash
    # For each env var in the plan:
    echo -n "$VALUE" | vercel env add VAR_NAME <environment>
    # Then verify by name-only:
    vercel env pull .env.production
    diff <(grep -E '^[A-Z_]+=' .env.production | cut -d'=' -f1 | sort) <expected-keys-from-Env.ts>
    ```
11. **Set spend cap**: dashboard → Project Settings → Spend Management → On-Demand Budget.
12. **First prod deploy**: `vercel deploy --prod` or git push to main.
13. **Monitor logs**: `vercel logs <deployment-url>` if red. Common failures cached in `references/known-pitfalls.md`.

---

## Gotchas

- **2026-04-15**: First build can fail on module resolution if `tsconfig.json` paths or `next.config.*` are not committed. Run `pnpm build` locally first — this is the gate.
- **2026-04-16**: TypeScript 6 `baseUrl` deprecation fires on Vercel's newer TS even when local build passes. Fix: `"ignoreDeprecations": "6.0"` in `tsconfig.json`. Pin TS in `package.json` to slow future drift.
- **2026-04-15**: Deployment Protection is on by default. Breaks Inngest sync, webhook integrations, and anything external that calls your app's API. Configure a bypass key in Project Settings → Deployment Protection → Protection Bypass for Automation.
- **Ongoing**: `vercel env add` reads from stdin. Piping avoids leaving the value in shell history: `echo -n "$VALUE" | vercel env add NAME production`.

---

## Dashboards & links

- Project: `https://vercel.com/{team}/{project}`
- Env vars: `https://vercel.com/{team}/{project}/settings/environment-variables`
- Deployment Protection: `https://vercel.com/{team}/{project}/settings/deployment-protection`
- Spend: `https://vercel.com/{team}/{project}/settings/spend`
- Domains: `https://vercel.com/{team}/{project}/settings/domains`
- Logs: `https://vercel.com/{team}/{project}/logs`

---

## Current-docs fallback

- Context7: `/vercel/next.js`, `/vercel/vercel` — primary source for framework + platform guidance.
- WebFetch: https://vercel.com/docs — for CLI flags, newer features.
- Vercel CLI expert skill: `vercel:vercel-cli` (if available in the session) — for edge cases.
