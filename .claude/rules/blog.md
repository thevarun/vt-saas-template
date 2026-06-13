---
paths:
  - "data/pseo/**"
  - "src/components/pseo/**"
---

# pSEO content authoring

Reference: [`docs/pseo-implementation-summary.md`](../../docs/pseo-implementation-summary.md). Content is JSON-driven, rendered with `react-markdown` — there is no MDX in this subsystem.

- **Pages live in `data/pseo/pages.json`**; categories in `data/pseo/categories.json`. Each page is one object validated against the `PseoPage` shape in `src/libs/pseo/data.ts`.
- **Required page fields:** `id`, `categoryId` (must match a category `id`), `slug`, `title`, `description`, `content` (Markdown string), `keywords` (string array), `lastModified` (ISO date). Keep `slug` URL-safe and unique within its category.
- **`content` is plain Markdown, not MDX.** No `import` / `export`, no raw JSX in the string — `react-markdown` renders it. To add custom rendering for a Markdown element, register it on the `components` prop of `<ReactMarkdown>` in `src/components/pseo/PseoTemplate.tsx`; don't put component tags in the content.
- New pages are statically generated and added to the sitemap on build — run `npm run build` to verify they render at `/{locale}/articles/{category}/{slug}`.
