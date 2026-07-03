# Changelog rendering & automation

The `/changelog` page renders a structured, optionally AI-humanized release feed
from `docs/changelog.json`. This directory documents the data flow, the schema,
and the automation that keeps the JSON up to date.

## Data flow

```
GitHub Releases API  →  AI humanizer  →  docs/changelog.json  →  /changelog page
  (release notes)       (claude-code-action)                      (server component)
```

1. semantic-release publishes a **GitHub Release** per version (release notes with
   commits grouped under Features / Bug Fixes / Performance). Releases are the
   source of truth — the config is tag-only (no `@semantic-release/git`), so there
   is **no** `docs/CHANGELOG.md` file.
2. The `Changelog Sync` workflow reads the Releases API, selects every version
   newer than the newest already in `docs/changelog.json`, and runs the humanizer
   prompt against those release notes to write user-facing entries.
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

The automation reads the GitHub Releases API directly, so it is **turn-key** once
these are in place (no `@semantic-release/changelog` plugin needed):

1. **The `CLAUDE_CODE_OAUTH_TOKEN` repo secret** (the same secret `claude.yml`
   already requires).
2. **"Allow auto-merge" enabled** in repo settings (Settings → General → Pull
   Requests).
3. **The workflow must be on the default branch.** `workflow_run` reads the
   workflow definition from `main`, so `changelog-sync.yml` only activates once
   it is merged to `main`. Use the **Run workflow** dispatch button to test it
   before then.
4. **A bounded high-water seed in `docs/changelog.json`.** The pre-check humanizes
   every release *newer* than the newest entry here. With an empty/absent file the
   first run would humanize the **entire** release history in one job (timeout
   risk) — so the template seeds a marker entry at its current version to stay
   dormant until the next release. A fresh fork resets this to `{"versions": []}`
   via `/init-downstream`, so its changelog-sync starts from the fork's first
   release.

### Alternative: a cloud routine

If you prefer running the humanizer as a hosted claude.ai cloud routine instead of
the in-repo workflow, you can point such a routine at the same prompt and
`docs/changelog.json` target. Pick one mechanism — running both will open
competing changelog PRs.

## Rendering without the automation

The rendering half works standalone today. Hand-edit `docs/changelog.json` (or
keep the sample) and the `/changelog` page renders it immediately — the automation
is only needed if you want releases humanized for you.
