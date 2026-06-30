# Background Jobs Pattern

Durable scheduled work with **at-most-once** semantics and crash recovery, built
on [Inngest](https://www.inngest.com/). The worked example throughout is the
generic `scheduled_tasks` table (`src/models/schema/scheduled-tasks.ts`) plus:

- `src/libs/jobs/claim.ts` — the atomic-claim helper (`claimDueTasks`)
- `src/libs/inngest/functions/scheduled-tasks.ts` — the cron + single-task worker
- `src/app/api/inngest/route.ts` — where both functions are registered

Copy this skeleton for any new durable job: add product columns to a job table,
swap in your work at the marked seam, and you inherit correct concurrency,
idempotency, and recovery for free.

## 1. Cron scaffolding

A job is two Inngest functions created via `inngest.createFunction`:

- **The cron** (`scheduledTasksCron`) — `triggers: [{ cron: '*/10 * * * *' }]`.
  It claims due work and fans it out. It does no product work itself.
- **The worker** (`processSingleTask`) — `triggers: [{ event: 'vt-saas/task.process' }]`,
  `retries: 3`, with an `onFailure` finalizer. It processes exactly one item.

Both handler bodies are **extracted as named exports** (`cronHandler`,
`singleTaskHandler`) so unit tests can exercise the step graph directly with a
typed step double, without booting the Inngest runtime. `createFunction` wraps
them with metadata; the body is passed as `handler as never` because Inngest's
step-context type is wider than the structural slice the handler depends on.

Each `step.run(name, fn)` is **independently memoized**: on a retry, an
already-completed step is replayed from its recorded result instead of
re-executing. That is why the claim runs inside `step.run('claim-due-tasks', …)`
— it must happen at most once per cron invocation even if a later step fails.

A small structural `JobLogger` (`{ info, warn, error }`) is declared locally so
the handlers accept either the Inngest logger or a plain test mock. The template
has no shared logger type; keep this adapter local and generic.

## 2. Fan-out

The cron sends **one event per claimed item** rather than processing the batch
inline:

```ts
await step.sendEvent(
  'dispatch-task-events',
  taskIds.map(taskId => ({ name: 'vt-saas/task.process', data: { taskId } })),
);
```

Each event becomes its own worker run with its own retry budget, so one failing
item can neither block nor re-run its siblings. The worker therefore contains
**no `step.run()`** — the work runs inline; isolated retry-per-item is the whole
point of the fan-out.

## 3. The 3-layer at-most-once guard

Duplicate dispatch and duplicate execution are prevented in layers, each guarding
a different race:

1. **Atomic claim UPDATE** (in `claimDueTasks`): a single
   `UPDATE … SET status='claimed' WHERE status='scheduled' AND scheduled_at <= now() RETURNING id`.
   Postgres MVCC makes the row transition atomic, so two concurrent cron ticks
   can never both claim the same row — only the rows this statement transitioned
   are returned and dispatched.
2. **Done-skip** (in the worker): `if (task.status === 'done') return;`. A
   duplicate event, or a retry that lands after the work already completed, must
   not run it again.
3. **Status guard** (in the worker): `if (task.status !== 'claimed') return;`.
   Anything other than `claimed` (e.g. `running` from a live sibling, or a
   settled `blocked`/`failed`) means another run already owns or finished the
   task.

## 4. Stale-reset (crash recovery)

If a worker crashes after the claim but before finishing, the task is stranded in
an in-flight state (`claimed`/`running`). `claimDueTasks` issues a second UPDATE
each tick that resets any task whose `updated_at` is older than
`STALE_TASK_THRESHOLD_MS` (30 min) back to `scheduled`, so the next tick
re-claims it:

```ts
UPDATE … SET status='scheduled'
WHERE status IN ('claimed','running') AND updated_at <= now() - interval '30 min'
```

## 5. The job-table contract

Any table a job claims from must carry, at minimum:

| Column          | Purpose                                                              |
| --------------- | ------------------------------------------------------------------- |
| `status`        | Lifecycle enum — `scheduled → claimed → running → done` (or `failed`/`blocked`). The claim filters and transitions on it. |
| `scheduled_at`  | Due-time the claim filters on (`scheduled_at <= now()`).            |
| `updated_at`    | Drives the stale-reset window (and the `set_updated_at` trigger).   |
| `blocked_reason`| Free-text reason when a downgrade/policy moves a task to `blocked`. |
| `last_error`    | Error recorded by `onFailure` when retries are exhausted.           |

Back the claim with a **partial index** on `(status, scheduled_at)
WHERE status = 'scheduled'` (`idx_scheduled_tasks_due`).

Job tables are **server-only**: written only by the cron and the admin client.
Enable RLS with **no policy** so all anon/authenticated REST access is denied
(the service role bypasses RLS) — the same convention `admin_audit_log` and the
`*_jobs` tables use. See [`.claude/rules/database.md`](../../.claude/rules/database.md)
and `supabase/prod-setup.sql`.

## Follow-up: token-refresh cron

A periodic OAuth token-refresh job reuses this exact scaffolding (named handler +
`createFunction` + logger adapter + a time-window claim). It lands once the OAuth
layer (`platform_connections` schema + token-encryption lib) is on `main`.
