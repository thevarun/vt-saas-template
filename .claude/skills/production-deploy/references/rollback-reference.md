# Rollback Reference

Keep this one click away during and after deploy. Don't improvise recovery — the wrong rollback is worse than the bug.

---

## Vercel

### Instant revert to previous production deployment
```bash
vercel rollback
```
Rollbacks the production alias to the previous successful deploy. No rebuild. Fastest option.

### Rollback to a specific deployment
```bash
vercel ls                         # list deployments
vercel rollback <deployment-url>  # point prod alias at that deploy
```

### Promote a known-good preview to production
```bash
vercel promote <preview-url>
```
Use when a preview has been manually verified and you want it live without re-pushing main.

**When to use which:**
- Incident just happened, last good known deploy is the previous one → `vercel rollback` (no args).
- Bug in last two deploys, third was good → `vercel rollback <specific-url>`.
- Ready to ship a fix that's on a PR preview → `vercel promote <preview-url>`.

---

## Supabase

### Migration rollback
There is no automated `migrate:down` in Drizzle by default. Options:

1. **Write a compensating migration** — safest. Schema backward-compat takes priority over tidy history.
2. **Manually run inverse SQL** — for small issues (drop a column added by the bad migration). Preview SQL, confirm, run via SQL Editor.
3. **Restore from point-in-time backup** — Supabase Pro+ plans have PITR. Free plan has daily backups only.

**Rule:** before running any migration against prod, take a manual backup snapshot if the plan supports it. Better: keep migrations additive and use feature flags for schema dependencies.

### RLS accidentally too permissive
If a policy is broken (returning rows it shouldn't):
```sql
ALTER TABLE {schema}.{table} DISABLE ROW LEVEL SECURITY;
-- Fix the policy
-- Re-enable
ALTER TABLE {schema}.{table} ENABLE ROW LEVEL SECURITY;
```
**But prefer**: fix the policy without disabling RLS. Disabling exposes the table during the gap.

---

## Stripe

### Webhook flooding from a bad event handler
1. Temporarily disable the webhook endpoint in Stripe Dashboard.
2. Fix the handler code.
3. Redeploy.
4. Re-enable the endpoint.
5. Replay missed events via Stripe Dashboard → Webhooks → select endpoint → "Resend missed events".

### Accidental live-mode switch
If you flipped to live mode prematurely:
1. Immediately disable the live-mode restricted API key.
2. Regenerate a new restricted key in test mode.
3. Update Vercel env `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to test-mode values.
4. Redeploy.
5. Any payments that succeeded in that window: honor or refund per your policy.

---

## DNS

### Reverting DNS changes
DNS has TTL — changes don't revert instantly. At your registrar:
1. Restore the previous A / CNAME records.
2. Users on old resolvers will see inconsistent state for up to the TTL duration (typical: 300-3600s).
3. Inform active users if feasible.

**Preventative**: set low TTL (300s) on critical records *before* making changes, so rollback is fast.

---

## OAuth apps

### If a client secret leaks
1. In the provider's developer portal, regenerate the client secret.
2. Update Vercel env with the new secret.
3. Redeploy.
4. Existing user OAuth tokens may or may not invalidate depending on the provider — audit.

### If a redirect URL was configured wrong
Just update it in the provider portal; no code change needed. Wait for the provider's cache (usually seconds).

---

## General incident flow

1. **Stop the bleeding**: `vercel rollback` is the fastest way to restore service.
2. **Diagnose on a feature branch**: don't debug on main.
3. **Fix + preview**: land the fix on a preview URL. Manually verify.
4. **Promote**: `vercel promote` or push to main.
5. **Post-mortem**: write a short note in `docs/deployment-guide.md` under "Known Issues" with dated entry + resolution.

---

## What NOT to do

- Don't `git revert` on main without testing — reverts can reintroduce older bugs.
- Don't drop/recreate a prod table to "fix" a schema issue. Use additive migrations.
- Don't disable RLS "just for a minute" — always take the policy path.
- Don't `vercel env rm` in a panic — Vercel won't restore it, and losing a secret during an incident is a worse incident.
