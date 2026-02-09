# Story 8.1: Share Widget Component

**Epic:** Epic 8: Go-To-Market Features
**Status:** ready-for-dev
**Story Type:** Feature Development
**Complexity:** Medium
**Sprint:** Epic 8, Story 1 of 5

---

## User Story

As a **user who wants to share the product**,
I want **an easy way to share on social platforms**,
So that **I can spread the word with minimal effort**.

---

## Acceptance Criteria

### AC1: Share Widget Component Displays Platform Buttons

**Given** the ShareWidget component
**When** I use it in any page
**Then** it displays share buttons for major platforms
**And** platforms include: Twitter/X, LinkedIn, Facebook, Copy Link
**And** buttons have recognizable platform icons

### AC2: Platform Share Dialog Opens with Pre-filled Text

**Given** I click a social share button
**When** the share action triggers
**Then** platform's share dialog opens
**And** pre-filled text includes page title/description
**And** URL being shared is the current page (or specified URL)

### AC3: Copy Link Provides Clipboard Feedback

**Given** I click "Copy Link"
**When** the action completes
**Then** URL is copied to clipboard
**And** I see confirmation feedback ("Copied!")
**And** feedback auto-dismisses after 2 seconds

### AC4: Component Props API

**Given** the ShareWidget component props
**When** I review the API
**Then** component accepts: url, title, description (optional)
**And** component accepts: platforms (array to customize which buttons)
**And** component accepts: variant (inline, popup, minimal)

### AC5: Mobile Native Share Support

**Given** the ShareWidget on mobile
**When** I view on small screens
**Then** native share API is used if available
**And** fallback to platform buttons if not
**And** buttons are touch-friendly

### AC6: Analytics Hook Points Documented

**Given** share analytics hook points
**When** I review the component code
**Then** each share click location has a documented analytics hook point
**And** hook point documents: event name (`share_clicked`), properties (`platform`, `url`, `page`)
**And** actual event firing is wired in Epic 9 instrumentation

---

## Technical Specification

### Component Interface

```typescript
type Platform = 'twitter' | 'linkedin' | 'facebook' | 'copy'

interface ShareWidgetProps {
  /** URL to share */
  url: string
  /** Pre-filled share title/text */
  title: string
  /** Optional description for platforms that support it + Web Share API */
  description?: string
  /** Which platforms to show (default: all four) */
  platforms?: Platform[]
  /** Visual variant */
  variant?: 'inline' | 'popup' | 'minimal'
  /** Additional CSS classes */
  className?: string
}
```

### Platform Configuration

```typescript
const platformConfig = {
  twitter: {
    label: 'X',
    icon: XIcon,
    hoverClass: 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  linkedin: {
    label: 'LinkedIn',
    icon: LinkedInIcon,
    hoverClass: 'hover:bg-[#0A66C2] hover:text-white',
    getUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  facebook: {
    label: 'Facebook',
    icon: FacebookIcon,
    hoverClass: 'hover:bg-[#1877F2] hover:text-white',
    getUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  copy: {
    label: 'Copy Link',
    icon: Link,  // from lucide-react
    hoverClass: 'hover:bg-emerald-500 hover:text-white',
    getUrl: () => '',
  },
}
```

### Share Handler with Native API Support

```typescript
const handleShare = async (platform: Platform) => {
  // TODO: Analytics — event: "share_clicked", properties: { platform, url, page: window.location.pathname }

  // Native Web Share API for mobile (all platforms except 'copy')
  if (platform !== 'copy' && navigator.share) {
    try {
      await navigator.share({ title, text: description, url })
      return
    } catch {
      // User cancelled or API failed — fall through to platform URL
    }
  }

  if (platform === 'copy') {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
    return
  }

  const shareUrl = platformConfig[platform].getUrl(url, title)
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400')
}
```

### File Structure

```
src/components/share/
├── ShareWidget.tsx          # Main component
├── platformIcons.tsx        # Brand SVG icons (X, LinkedIn, Facebook)
└── index.ts                 # Barrel export
```

---

## Implementation Guidelines

### Dependencies

**shadcn components to install:**
```bash
npx shadcn@latest add popover
```

**Note:** `button` and `tooltip` are already installed.

### Component Mapping

| UI Element | Component | Variant/Props | Notes |
|------------|-----------|---------------|-------|
| Share buttons (inline) | shadcn `Button` | `variant="outline"`, `size="sm"` | Replace `motion.button` from designs |
| Popup trigger | shadcn `Popover` + `PopoverTrigger` | - | Replace custom popup div |
| Popup menu | shadcn `PopoverContent` | `align="start"`, `className="w-[180px] p-2"` | Replace AnimatePresence menu |
| Tooltip (minimal) | shadcn `Tooltip` + `TooltipTrigger` + `TooltipContent` | - | Platform name on hover |
| Copy feedback | sonner `toast.success()` | - | Replace in-button "Copied!" text |

### Icons

| Platform | Icon Source | Notes |
|----------|-----------|-------|
| Twitter/X | Custom inline SVG (from MagicPatterns) | No official lucide icon for X |
| LinkedIn | Custom inline SVG (from MagicPatterns) | Brand icon not in lucide |
| Facebook | Custom inline SVG (from MagicPatterns) | Brand icon not in lucide |
| Copy Link | `Link` from lucide-react | Replace inline SVG |
| Copied | `Check` from lucide-react | Replace inline SVG |
| Share (popup trigger) | `Share2` from lucide-react | Replace inline SVG |

### Code Style Requirements

- Add `'use client'` directive (interactive component)
- Use `cn()` from `@/utils/Helpers` for className merging
- Use semantic color tokens (`bg-muted`, `text-foreground`, `text-muted-foreground`)
- Keep platform brand colors for hover states (e.g., `hover:bg-[#0A66C2]`)
- Use Tailwind `transition-colors duration-200` (no framer-motion)
- Ensure touch-friendly targets: `min-h-[44px]` on interactive elements
- No semicolons, single quotes for JSX (Antfu ESLint config)

### Analytics Hook Points

```typescript
// In handleShare():
// TODO: Analytics — event: "share_clicked", properties: { platform, url, page: window.location.pathname }

// In popup open handler:
// TODO: Analytics — event: "share_menu_opened", properties: { variant, page: window.location.pathname }
```

**IMPORTANT:** Do NOT import analytics utilities. Epic 9 handles actual event firing.

---

## Dev Notes

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| ShareWidget | MagicPatterns | https://www.magicpatterns.com/c/34p4xdfkgkybb9o4pxpwaw | ShareWidget.tsx |

**Extraction Command:**
```typescript
mcp__magic-patterns__read_files(
  url: "https://www.magicpatterns.com/c/34p4xdfkgkybb9o4pxpwaw",
  fileNames: ["ShareWidget.tsx"]
)
```

**Adaptation Checklist:**
- [ ] Replace `motion.button` with shadcn `Button` (add `transition-colors duration-200`)
- [ ] Replace custom popup with shadcn `Popover` component
- [ ] Replace `bg-neutral-*` colors with semantic tokens (`bg-muted`, `text-foreground`)
- [ ] Replace in-button "Copied!" text with sonner `toast.success("Link copied!")`
- [ ] Replace class concatenation with `cn()` from `@/utils/Helpers`
- [ ] Add `'use client'` directive at top of file
- [ ] Add `description` prop and integrate with Web Share API
- [ ] Implement native `navigator.share()` with fallback
- [ ] Extract brand SVG icons to `platformIcons.tsx`
- [ ] Replace lucide-compatible icons (Copy Link: `Link`, Copied: `Check`, Share trigger: `Share2`)
- [ ] Add analytics TODO comments (do NOT import analytics)
- [ ] Create barrel export in `index.ts`

**Reference Documents:**
- Design Brief: `_bmad-output/planning-artifacts/ux-design/epic-8-gtm-design-brief.md`
- Component Strategy: `_bmad-output/planning-artifacts/ux-design/epic-8-sharewidget-component-strategy.md`

### Adaptations from MagicPatterns Code

| What | Before (MagicPatterns) | After (Project) |
|------|----------------------|------------------|
| Animation | `motion.button`, `whileHover`, `whileTap`, `AnimatePresence` | `transition-colors duration-200` on buttons, CSS `scale` on `:active` |
| Popup | Custom div with `AnimatePresence` + backdrop | shadcn `Popover` component |
| Colors | `bg-neutral-100 dark:bg-neutral-800`, `text-neutral-700` | `bg-muted`, `text-foreground`, `text-muted-foreground` |
| Copy feedback | In-button "Copied!" text with animation | `toast.success("Link copied!")` via sonner + icon swap with CSS transition |
| Class merging | String concatenation | `cn()` from `@/utils/Helpers` |

### Testing Strategy

**Manual Testing:**
1. Test all three variants: inline, popup, minimal
2. Test each platform button opens correct share dialog
3. Test Copy Link copies URL and shows toast feedback
4. Test native share API on mobile device/emulator
5. Test custom platform filtering via `platforms` prop
6. Test with/without description prop
7. Verify touch targets are at least 44x44px
8. Test keyboard navigation in popup variant
9. Verify dark mode appearance

**Visual Verification:**
- Capture screenshots of all three variants using Playwright MCP
- Save to `_bmad-output/implementation-artifacts/screenshots/`
- Verify platform icons are recognizable
- Verify hover states match platform brand colors

---

## Definition of Done

- [ ] ShareWidget component created in `src/components/share/ShareWidget.tsx`
- [ ] Platform SVG icons extracted to `src/components/share/platformIcons.tsx`
- [ ] Barrel export created in `src/components/share/index.ts`
- [ ] shadcn `popover` component installed
- [ ] Component accepts all required props (url, title, description, platforms, variant)
- [ ] All three variants implemented (inline, popup, minimal)
- [ ] All four platforms supported (Twitter/X, LinkedIn, Facebook, Copy Link)
- [ ] Native Web Share API implemented with fallback
- [ ] Copy Link uses clipboard API with sonner toast feedback
- [ ] Analytics hook points documented with TODO comments (no imports)
- [ ] Component uses `'use client'` directive
- [ ] Code follows project style (no semicolons, single quotes, semantic colors)
- [ ] Touch-friendly buttons (min-h-[44px])
- [ ] Keyboard navigation works in popup variant
- [ ] Manual testing completed for all variants and platforms
- [ ] Screenshots captured for visual verification
- [ ] Component is ready for use in other stories (8.2, 8.5, etc.)

---

## Related Stories

- **8.2: Private Shareable URLs** - Will use ShareWidget for sharing generated links
- **8.5: Programmatic SEO Pages** - Will use ShareWidget on pSEO pages

---

## Notes for Developer

This component will be reused across multiple features in Epic 8. Ensure it's flexible and well-documented.

The MagicPatterns design includes a demo page (`ShareWidgetDemo.tsx`) - use it as reference for usage patterns, but don't extract it to the codebase (it's for learning only).

Brand icons for Twitter/X, LinkedIn, and Facebook must stay as inline SVGs since lucide-react doesn't include brand logos. Keep them in the extracted code or move to a separate `platformIcons.tsx` helper.

**Parallel Development Note:** Epic 9 will add actual analytics event firing. Your TODO comments will serve as the integration points. Do NOT import any analytics utilities in this story.
