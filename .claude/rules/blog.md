---
paths:
  - "content/blog/**"
  - "src/components/pseo/**"
  - "src/libs/pseo/**"
---

# pSEO / blog content authoring

Reference: [`docs/pseo-implementation-summary.md`](../../docs/pseo-implementation-summary.md). Content is disk-based MDX, loaded with gray-matter + Zod-validated frontmatter and rendered with `next-mdx-remote/rsc`.

- **Articles live as MDX on disk** under `content/blog/{category-slug}/{post-slug}.mdx`. One folder per category. The filename (without `.mdx`) is the slug — keep it URL-safe and unique within its category. Files prefixed with `_` are skipped.
- **Category metadata is optional.** Add a `content/blog/{category}/_category.md` with `name` and `description` frontmatter to override the display name; otherwise the loader title-cases the folder slug and uses an empty description.
- **Required page frontmatter:** `title`, `description`, `lastModified` (ISO date). `keywords` (string array) is optional. Frontmatter is validated against `frontmatterSchema` in `src/libs/pseo/data.ts` — an invalid file throws at load with the offending path.
- **The body is MDX.** `next-mdx-remote` does NOT support `import` / `export` inside `.mdx`. Custom components used in articles (`Cta`, `Callout`, `ComparisonTable`) must be registered in `src/components/pseo/mdx-components.tsx`; reference them by tag in the body. GFM (tables, strikethrough, task lists) and heading anchor IDs are enabled via `remark-gfm` + `rehype-slug`.
- **Override the content root** with `PSEO_CONTENT_ROOT` (used by tests to point at fixtures); it defaults to `<cwd>/content/blog`. The module cache is bypassed outside production so edits surface without a dev-server restart.
- New pages are statically generated and added to the sitemap on build — run `npm run build` to verify they render at `/{locale}/blog/{category}/{slug}`.
- **Trust boundary — keep `content/blog/**` author-controlled.** The YAML frontmatter parser (gray-matter → js-yaml) and the MDX renderer run with the implicit trust that this content is written by maintainers. `js-yaml` 3.x carries a moderate quadratic-complexity DoS advisory (GHSA-h67p-54hq-rp68) that only matters for attacker-supplied YAML, and JSON-LD/MDX rendering assumes non-hostile frontmatter. Never wire user-submitted content directly into this pipeline. (JSON-LD output is additionally hardened via `serializeJsonLd` in `src/libs/seo/json-ld.ts`, which escapes `<` so a frontmatter value can't break out of the `<script>` tag.)
