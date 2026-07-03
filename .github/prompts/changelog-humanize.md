# Changelog humanizer

You maintain the human-readable changelog for this repository, cloned as your
working directory. This runs after semantic-release publishes one or more
versions. The git branch, commit, pull request, and merge are all handled by the
workflow — your ONLY job is to edit `docs/changelog.json`. Do NOT run git, gh,
branch, commit, or PR commands, and do NOT modify any other file.

## Steps

1. Read the **pending-releases JSON file** — the developer source of truth (NEVER
   modify it). Its absolute path is given at the very end of these instructions.
   It is a newest-first array of `{ version, date, notes }`, one entry per
   published GitHub Release; `notes` is the release body with commits grouped
   under Features / Bug Fixes / Performance. Read `docs/changelog.json` if it
   exists (shape `{ "versions": [ ... ] }`, newest-first).

2. Find every `version` in the pending-releases file but NOT yet in
   `changelog.json`. Process ALL of them, newest-first (not just the topmost — a
   rolling branch may have several pending). If every release version is already
   present, make NO changes and stop (idempotent — produce no edits).

3. Learn the product and audience from `CLAUDE.md` (Project Overview) and the
   writing voice from `docs/voice.md` (fall back to the voice guidance in
   `CLAUDE.md` if that file is absent). The audience is the product's end users
   (non-engineers) — NOT engineers.

4. For each missing version, classify every commit as one of:
   - **highlight** — a user-facing feat / perf / fix worth celebrating.
   - **under_the_hood** — reliability, security, or internal work worth
     mentioning for transparency (e.g. a security dependency fix).
   - **drop** — pure ci / build / lint / test / chore / routine dependency bump
     with no user relevance.

   Write highlights benefit-led — lead with what the user can now do. No scope
   prefixes, no commit hashes, no jargon. NEVER invent features; only rephrase
   what the commit messages state. If unsure whether something is user-facing,
   demote it to `under_the_hood`. A **security** dependency fix is NOT a `drop` —
   surface it under the hood. A routine, non-security dependency bump or
   devDependency move IS a `drop`.

   If a version contains NO user-facing or transparency-worthy change (it is
   entirely ci / build / lint / test / chore / routine deps / internal tooling),
   do NOT create an entry for it — skip that version entirely.

5. Build each entry to this schema exactly:

   ```json
   {
     "version": "1.30.0",
     "date": "2026-06-20",
     "summary": "One short sentence describing the release.",
     "highlights": [
       {
         "tag": "new",
         "title": "Short, benefit-led title",
         "body": "One or two sentences in the product voice."
       }
     ],
     "underTheHood": ["Short transparency note"]
   }
   ```

   Field rules: `version` and `date` (`YYYY-MM-DD`) come from the pending-releases
   entry (`version`, `date`). `summary` is one short sentence. `tag` is exactly one of `new` (a new
   capability), `improved` (an improvement or performance win), or `fixed` (a bug
   fix). `highlights` and `underTheHood` may each be empty, but do not emit an
   entry where both are empty (that version should have been skipped per step 4).

6. Prepend the new entries to the `versions` array (newest-first), preserving ALL
   existing entries verbatim. If `docs/changelog.json` does not exist, create it
   as `{ "versions": [ <entries> ] }`. Ensure the final file is valid JSON.

7. Edit ONLY `docs/changelog.json`.
