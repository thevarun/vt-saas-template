---
paths:
  - "src/components/admin/**"
  - "src/app/[locale]/(admin)/**"
  - "src/app/api/admin/**"
---

# Admin panel styling

Admin is a **maintainer tool** — it must NOT follow the consumer product theme.
A downstream fork can ship warm/sage/branded consumer themes; the admin panel
stays on the default slate/blue palette regardless.

- **How it works:** `AdminLayoutClient` sets `data-admin` on its root div (SSR,
  no flash) and mirrors it onto `document.body` via a client effect. The
  `[data-admin]` / `.dark [data-admin]` blocks in `src/styles/global.css`
  re-declare the full default token set, so admin always renders the default
  light/dark theme. Light/dark is respected; theme hue is not.
- **The body mirror is load-bearing.** Radix portals (Dialog, Sheet, Popover,
  Select, DropdownMenu, Tooltip) mount to `document.body`, outside the layout
  div. Without `data-admin` on `body` they escape the scope and leak the
  consumer theme. Don't remove the body effect.
- **Use theme tokens** (`bg-sidebar`, `bg-card`, `bg-muted`,
  `text-muted-foreground`, `border-sidebar-border`, …). They resolve to the
  admin-scoped values automatically. **Never** hardcode colors (`bg-slate-800`,
  `bg-blue-600`, `dark:bg-black`) and **never** add a consumer-theme class here.
- **To retint admin,** edit the two `[data-admin]` blocks in `global.css` —
  nowhere else. The sidebar is intentionally always-dark (overrides the
  near-white default `--sidebar`).
