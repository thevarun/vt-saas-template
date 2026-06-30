# Resend

**Purpose in this codebase**: Transactional + auth email sending. Serves as SMTP relay for Supabase Auth magic-link / confirmation emails so users see branded sender.
**Used for**: Supabase Auth emails (magic link, password reset, email confirm) + any app transactional emails.
**Tool**: Resend REST API via `curl` (no MCP known) → dashboard (last resort).
**Dependency group**: A (infra) — DNS verification is a dependency for wiring into Supabase Auth SMTP.
**Last updated**: 2026-04-21

---

## Project-specific conventions

- **Send from a subdomain**, not the root domain: `mail.{PRODUCTION_DOMAIN}`. Rationale: isolates sending reputation from main domain — if the app domain ever gets spam-flagged, main traffic is unaffected.
- **Narrow-scoped API key** — sending-only permission, not full-access.
- **Sender format**: `{EMAIL_FROM_NAME} <noreply@mail.{PRODUCTION_DOMAIN}>`.

---

## Setup during first prod deploy

### Sub-steps (track each in state file)

1. **Add domain in Resend**: `POST /domains` with `name=mail.{PRODUCTION_DOMAIN}`.
2. **Fetch DNS records to add**: Resend returns SPF + DKIM + DMARC records (names, types, values). Show to user.
3. **Add DNS records at registrar** (Porkbun/Cloudflare). Wait for propagation.
4. **Verify domain in Resend**: poll `GET /domains/{id}` until `status=verified`. Can take 1-60 minutes.
5. **Create sending API key**: narrowest scope (sending-only). Retrieve key once, add directly to Vercel env as `RESEND_API_KEY`. **Never paste in chat.**
6. **Set `EMAIL_FROM_ADDRESS=noreply@mail.{PRODUCTION_DOMAIN}` and `EMAIL_FROM_NAME={project-name}` in Vercel env (production + preview).**
7. **⚠️ Wire custom SMTP into Supabase Auth** — this is a separate sub-step, not "just DNS". See `supabase.md#smtp-wire-up`. This is the one that silently fails if skipped.

---

## Gotchas

- **2026-04-16 (THE big one)**: **Resend DNS verified ≠ Supabase sending from branded address.** Verifying the domain in Resend is independent from wiring SMTP into Supabase Auth. After Resend shows green, you must still go to Supabase Dashboard → Project Settings → Auth → SMTP Settings and enter the Resend SMTP credentials. Verify by triggering a test signup and inspecting the email's `From` field — must show `noreply@mail.{PRODUCTION_DOMAIN}`, not `noreply@mail.app.supabase.io`.
- **SPF conflicts**: if the domain already has an SPF record (e.g., for Google Workspace), merge carefully — multiple SPF records cause delivery failures. Resend supports `include:` chains.
- **DMARC soft-start**: set DMARC to `p=none` for the first 2-4 weeks to gather reports; tighten to `p=quarantine` once you've verified no legitimate mail is failing.

---

## Dashboards & links

- Domains: `https://resend.com/domains`
- API Keys: `https://resend.com/api-keys`
- Emails log: `https://resend.com/emails`

---

## Current-docs fallback

- Context7: `/resend/resend-node` (for the Node SDK; DNS setup is via REST).
- WebFetch: https://resend.com/docs/send-with-nextjs
- WebFetch: https://resend.com/docs/dashboard/domains/introduction (for DNS record formats)

---

## SMTP credentials for Supabase wire-up

After domain verify + API key creation, the Supabase SMTP config uses:
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: `{RESEND_API_KEY}` (the same key you set in Vercel env)
- Sender email: `noreply@mail.{PRODUCTION_DOMAIN}`
- Sender name: per project

Verify live via a fresh-email test signup in Supabase.
