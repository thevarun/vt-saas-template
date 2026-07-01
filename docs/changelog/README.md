# Changelog rendering & automation

The `/changelog` page renders a structured, optionally AI-humanized release feed
from `docs/changelog.json`. This directory documents the data flow, the schema,
and the automation that keeps the JSON up to date.

## Data flow

```
release-generated changelog source  →  AI humanizer  →  docs/changelog.json  →  /changelog page
        (docs/CHANGELOG.md)            (claude-code-action)                       (server component)
```

1. semantic-release produces a developer-facing `docs/CHANGELOG.md` (commits
   grouped under Features / Bug Fixes / Performance) — see the prerequisite below.
2. The `Changelog Sync` workflow runs the humanizer prompt against that file and
   writes user-facing entries to `docs/changelog.json`.
3. The `/changelog` page (`src/app/[locale]/(unauth)/(marketing)/changelog/page.tsx`)
   `fs`-reads `docs/changelog.json` at build/request time and renders one card per
   version with tag badges, highlights, and a collapsible "Under the hood" list.
   When the file is missing or empty it shows a translated empty state.

## Schema

The shape is defined in
[`src/app/[locale]/(unauth)/(marketing)/changelog/types.ts`](../../src/app/%5Blocale%5D/%28unauth%29/%28marketing%29/changelog/types.ts):

```json
{
  "versions": [
    {
      "version": "1.0.0",
      "date": "2026-01-01",
      "summary": "One short sentence describing the release.",
      "highlights": [
        {
          "tag": "new",
          "title": "Short, benefit-led title",
          "body": "One or two sentences."
        }
      ],
      "underTheHood": ["Short transparency note"]
    }
  ]
}
```

- `tag` is one of `new`, `improved`, or `fixed` (the `ChangelogTag` union). Each
  maps to a styled `Badge` variant and an i18n label (`tagNew` / `tagImproved` /
  `tagFixed`).
- `docs/changelog.json` ships with a tiny sample so a fresh fork renders a
  populated page out of the box. Replace it with your own entries, or let the
  automation maintain it.

## Automation

[`.github/workflows/changelog-sync.yml`](../../.github/workflows/changelog-sync.yml)
runs [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action)
against the prompt in
[`.github/prompts/changelog-humanize.md`](../../.github/prompts/changelog-humanize.md).
The action only ever edits `docs/changelog.json` (the workflow fails the run if it
touches anything else). The workflow itself owns git: it opens a single rolling
`changelog/auto` PR, rebases it onto `main` before appending new entries, and
squash-auto-merges it once mergeable.

The workflow chains off the existing `Release` workflow via `workflow_run`, so it
fires automatically after each release — no manual trigger is required for normal
operation.

### Prerequisites

The automation is **not turn-key** in a fresh template. Before it does anything:

1. **A release-maintained source file at `docs/CHANGELOG.md`.** Both the
   workflow's pre-check (a `grep` for the newest version) and the humanizer prompt
   read `docs/CHANGELOG.md` as the release source of truth. The template's current
   `semantic-release` config (`package.json` → `release.plugins`) only creates
   GitHub Releases — it does **not** generate `docs/CHANGELOG.md`. You must add
   `@semantic-release/changelog` (with `changelogFile: docs/CHANGELOG.md`) and
   `@semantic-release/git` to the release config first. **Until that lands, this
   workflow is dormant-but-correct:** its pre-check finds no `docs/CHANGELOG.md`
   (or no version in it) and skips, so nothing breaks.
2. **The `CLAUDE_CODE_OAUTH_TOKEN` repo secret** (the same secret `claude.yml`
   already requires).
3. **"Allow auto-merge" enabled** in repo settings (Settings → General → Pull
   Requests).
4. **The workflow must be on the default branch.** `workflow_run` reads the
   workflow definition from `main`, so `changelog-sync.yml` only activates once
   it is merged to `main`. Use the **Run workflow** dispatch button to test it
   before then.

### Alternative: a cloud routine

If you prefer running the humanizer as a hosted claude.ai cloud routine instead of
the in-repo workflow, you can point such a routine at the same prompt and
`docs/changelog.json` target. Pick one mechanism — running both will open
competing changelog PRs.

## Rendering without the automation

The rendering half works standalone today. Hand-edit `docs/changelog.json` (or
keep the sample) and the `/changelog` page renders it immediately — the automation
is only needed if you want releases humanized for you.
