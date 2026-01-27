# Story 3.7: Loading States Pattern Library

Status: ready-for-dev

## Story

As a **user waiting for content to load**,
I want **to see appropriate loading indicators**,
So that **I know the app is working and what to expect**.

## Acceptance Criteria

**AC1: Skeleton Loaders Match Content Shape**
- **Given** a page or section loading async data
- **When** the data is being fetched
- **Then** I see skeleton loaders matching content shape
- **And** skeletons animate subtly (pulse or shimmer)
- **And** layout shift is minimal when content loads

**AC2: Component Library Loading Components**
- **Given** the component library
- **When** I review loading components
- **Then** there is a Skeleton component for content placeholders
- **And** there is a Spinner component for action feedback
- **And** there are variants for different sizes

**AC3: Content-Specific Skeleton Variants**
- **Given** skeleton loaders
- **When** I view them across the app
- **Then** they match the shape of the content they replace
- **And** cards have card-shaped skeletons
- **And** text has line-shaped skeletons
- **And** avatars have circle-shaped skeletons

**AC4: Button Loading States**
- **Given** an action button triggering async operation
- **When** I click the button
- **Then** I see a spinner in/on the button
- **And** the button is disabled during loading
- **And** spinner size is appropriate for the button

**AC5: Full-Page Loading States**
- **Given** a full-page loading state
- **When** initial page data is loading
- **Then** I see a centered spinner or skeleton layout
- **And** there is no flash of empty content
- **And** transition to loaded state is smooth

**AC6: Slow Connection Handling**
- **Given** loading states on slow connections
- **When** loading takes more than 3 seconds
- **Then** loading indicator remains visible
- **And** user is not left wondering if app is frozen
- **And** timeout handling shows appropriate message if needed

## Tasks / Subtasks

### Task 1: Extract & Adapt Skeleton Component from MagicPatterns (AC1, AC2, AC3)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn", fileNames: ["Skeleton.tsx"])
  ```
- [ ] **CREATE** ui component directory (if needed):
  - [ ] Ensure `src/components/ui/` directory exists
  - [ ] Extract `Skeleton.tsx` component code
- [ ] **COMPARE** with existing shadcn skeleton:
  - [ ] Check if `src/components/ui/skeleton.tsx` exists from shadcn
  - [ ] Compare extracted MagicPatterns version with shadcn version
  - [ ] Use the more feature-complete version or merge best features
- [ ] **ADAPT** extracted code for project:
  - [ ] Add proper TypeScript types for all props
  - [ ] Ensure Tailwind classes match project design system
  - [ ] Add pulse/shimmer animation if not present
  - [ ] Ensure dark mode support with `dark:` variants
- [ ] **DEFINE** component interface:
  ```typescript
  interface SkeletonProps {
    variant?: 'text' | 'card' | 'avatar' | 'button' | 'table-row';
    className?: string;
    width?: string;
    height?: string;
  }
  ```

### Task 2: Implement Skeleton Variants (AC1, AC3)
- [ ] **TEXT VARIANT**:
  - [ ] Single line: h-4 w-full (or custom width)
  - [ ] Multiple lines: Stack with space-y-2
  - [ ] Responsive widths: different line lengths
- [ ] **CARD VARIANT**:
  - [ ] Match card shape: rounded corners
  - [ ] Height: h-32 to h-48 depending on content
  - [ ] Full width within container
- [ ] **AVATAR VARIANT**:
  - [ ] Circular: rounded-full
  - [ ] Size: w-10 h-10 (40px), or w-12 h-12 (48px)
  - [ ] Can be used inline or in lists
- [ ] **BUTTON VARIANT**:
  - [ ] Match button shape: rounded-md
  - [ ] Height: h-10 (40px) matching button height
  - [ ] Width: w-24 to w-32 depending on context
- [ ] **TABLE ROW VARIANT**:
  - [ ] Multiple cells: flex with gap
  - [ ] Height: h-12 matching table row
  - [ ] Different widths per column
- [ ] Style variants with conditional Tailwind classes
- [ ] All variants have consistent animation

### Task 3: Style Skeleton Component (AC1)
- [ ] **BASE STYLING**:
  - [ ] Background: `bg-muted/50` (subtle gray)
  - [ ] Dark mode: `dark:bg-muted/30`
  - [ ] Border radius: variant-specific (rounded, rounded-md, rounded-full)
- [ ] **ANIMATION**:
  - [ ] Add pulse or shimmer animation
  - [ ] Use Tailwind `animate-pulse` or custom keyframes
  - [ ] Duration: 1.5s to 2s for smooth effect
  - [ ] Infinite loop
- [ ] **RESPONSIVE BEHAVIOR**:
  - [ ] Skeleton inherits container width by default
  - [ ] Can override with className or width prop
  - [ ] Works in flex and grid layouts
- [ ] **DARK MODE SUPPORT**:
  - [ ] Background adjusts with `dark:` variants
  - [ ] Animation remains visible in both modes
  - [ ] Contrast maintained for visibility

### Task 4: Extract & Adapt Spinner Component from MagicPatterns (AC2, AC4)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn", fileNames: ["Spinner.tsx"])
  ```
- [ ] **CREATE** Spinner component:
  - [ ] Location: `src/components/ui/spinner.tsx`
  - [ ] Extract component code
- [ ] **ADAPT** extracted code for project:
  - [ ] Use `Loader2` icon from `lucide-react`
  - [ ] Add proper TypeScript types
  - [ ] Use Tailwind `animate-spin` for rotation
  - [ ] Ensure dark mode support
- [ ] **DEFINE** component interface:
  ```typescript
  interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  ```

### Task 5: Implement Spinner Sizes (AC2, AC4)
- [ ] **SMALL (sm)**:
  - [ ] Size: 16px (w-4 h-4)
  - [ ] Use case: Inline text, small buttons
  - [ ] Stroke width: 2px
- [ ] **MEDIUM (md)**:
  - [ ] Size: 24px (w-6 h-6)
  - [ ] Use case: Regular buttons, inline loading
  - [ ] Stroke width: 2px (default)
- [ ] **LARGE (lg)**:
  - [ ] Size: 48px (w-12 h-12)
  - [ ] Use case: Full-page loading, centered spinners
  - [ ] Stroke width: 2px or 3px
- [ ] Size mapping with conditional classes
- [ ] Consistent animation speed across sizes

### Task 6: Style Spinner Component (AC2, AC4)
- [ ] **BASE STYLING**:
  - [ ] Use Loader2 icon from lucide-react
  - [ ] Color: `text-primary` or `text-muted-foreground`
  - [ ] Animation: `animate-spin` from Tailwind
- [ ] **SIZE MAPPING**:
  ```typescript
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  }
  ```
- [ ] **DARK MODE SUPPORT**:
  - [ ] Color adjusts with `dark:` variants
  - [ ] Visible against both light and dark backgrounds
- [ ] **OPTIONAL CENTERED WRAPPER**:
  - [ ] For full-page loading: center vertically and horizontally
  - [ ] Use flex with items-center justify-center

### Task 7: Create LoadingCard Component (AC3, AC5)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn", fileNames: ["LoadingCard.tsx"])
  ```
- [ ] **CREATE** component:
  - [ ] Location: `src/components/ui/loading-card.tsx`
  - [ ] Composite component using Skeleton variants
- [ ] **IMPLEMENT** structure:
  - [ ] Card wrapper (matches shadcn Card styling)
  - [ ] Avatar skeleton (top or left)
  - [ ] Title skeleton (1-2 lines)
  - [ ] Description skeleton (2-3 lines)
  - [ ] Optional button skeleton (bottom)
- [ ] **ADAPT** for project patterns:
  - [ ] Use project's Card component or matching styles
  - [ ] Use Skeleton component for all placeholders
  - [ ] Responsive layout (mobile-first)
  - [ ] Dark mode support

### Task 8: Add Usage Examples to Component Files (AC2)
- [ ] **Skeleton JSDoc**:
  ```typescript
  /**
   * Skeleton Component - Content placeholder during loading
   *
   * @example Text skeleton
   * <Skeleton variant="text" className="h-4 w-[250px]" />
   *
   * @example Card skeleton
   * <Skeleton variant="card" className="h-32 w-full" />
   *
   * @example Avatar skeleton
   * <Skeleton variant="avatar" className="w-12 h-12" />
   *
   * @example Custom skeleton
   * <Skeleton className="h-20 w-20 rounded-xl" />
   */
  ```
- [ ] **Spinner JSDoc**:
  ```typescript
  /**
   * Spinner Component - Loading indicator for actions and page loads
   *
   * @example Small spinner (inline)
   * <Spinner size="sm" />
   *
   * @example Button with spinner
   * <Button disabled>
   *   <Spinner size="sm" className="mr-2" />
   *   Loading...
   * </Button>
   *
   * @example Full-page loading
   * <div className="flex items-center justify-center min-h-screen">
   *   <Spinner size="lg" />
   * </div>
   */
  ```
- [ ] **LoadingCard JSDoc** with usage examples

### Task 9: Create Demonstration Page (AC2, AC3)
- [ ] Create `src/app/[locale]/(auth)/dashboard/design-system/loading/page.tsx`
- [ ] Showcase all loading patterns:
  - [ ] Text skeleton (single line, multiple lines)
  - [ ] Card skeleton
  - [ ] Avatar skeleton
  - [ ] Button skeleton
  - [ ] Table row skeleton
  - [ ] LoadingCard component
  - [ ] Spinner sizes (sm, md, lg)
  - [ ] Button with spinner
  - [ ] Full-page loading example
- [ ] Side-by-side comparison: skeleton → loaded content
- [ ] Helpful for designers/developers reference
- [ ] Can be removed before production or kept

### Task 10: Add i18n Support for Loading Messages (AC6)
- [ ] Add loading-related translation keys to `src/locales/en.json`:
  ```json
  "Loading": {
    "loading": "Loading...",
    "pleaseWait": "Please wait",
    "loadingContent": "Loading content",
    "timeout": "Loading is taking longer than expected",
    "retry": "Retry",
    "slowConnection": "Slow connection detected"
  }
  ```
- [ ] Add same keys to `hi.json` with Hindi translations
- [ ] Add same keys to `bn.json` with Bengali translations
- [ ] Document usage pattern in component JSDoc

### Task 11: Implement Button Loading State Pattern (AC4)
- [ ] Create usage example for buttons:
  ```typescript
  <Button disabled={isLoading} onClick={handleAction}>
    {isLoading ? (
      <>
        <Spinner size="sm" className="mr-2" />
        Loading...
      </>
    ) : (
      'Submit'
    )}
  </Button>
  ```
- [ ] Document pattern in component JSDoc
- [ ] Add to demonstration page
- [ ] Test with different button sizes and variants

### Task 12: Mobile Optimization (AC1, AC3)
- [ ] Test on mobile viewports (375px, 390px, 428px):
  - [ ] Skeletons fill container width properly
  - [ ] LoadingCard stacks elements vertically on small screens
  - [ ] Spinners remain centered
  - [ ] No horizontal scroll
  - [ ] Animation performance smooth
- [ ] Use Tailwind responsive classes throughout
- [ ] Test in both portrait and landscape orientations

### Task 13: Write Unit Tests
- [ ] Create `src/components/ui/__tests__/Skeleton.test.tsx`
- [ ] Test Skeleton component:
  - [ ] Renders with default variant
  - [ ] Renders with each variant (text, card, avatar, button)
  - [ ] Applies custom className
  - [ ] Has animation class
- [ ] Create `src/components/ui/__tests__/Spinner.test.tsx`
- [ ] Test Spinner component:
  - [ ] Renders with default size
  - [ ] Renders with each size (sm, md, lg)
  - [ ] Has animate-spin class
  - [ ] Applies custom className
- [ ] Create `src/components/ui/__tests__/LoadingCard.test.tsx`
- [ ] Test LoadingCard component:
  - [ ] Renders skeleton elements
  - [ ] Matches card structure

### Task 14: Performance Testing (AC6)
- [ ] Test skeleton → content transition:
  - [ ] No layout shift (CLS = 0)
  - [ ] Smooth fade-in animation
  - [ ] No flash of empty content
- [ ] Test on slow 3G connection:
  - [ ] Spinners remain visible
  - [ ] No perceived freeze
  - [ ] Animation remains smooth
- [ ] Test multiple skeletons rendering:
  - [ ] Performance impact minimal
  - [ ] No jank or stuttering

## Dev Notes

### Architecture Compliance

**Component Organization:**
- Location: `src/components/ui/` (design system components)
- Skeleton: `src/components/ui/skeleton.tsx` (may exist from shadcn)
- Spinner: `src/components/ui/spinner.tsx`
- LoadingCard: `src/components/ui/loading-card.tsx`
- Tests: `src/components/ui/__tests__/`
- Demo page: `src/app/[locale]/(auth)/dashboard/design-system/loading/page.tsx`

**Component Pattern (Pure UI Components):**
```typescript
// Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'table-row'
  className?: string
}

export function Skeleton({
  variant = 'text',
  className,
  ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-lg',
    avatar: 'size-10 rounded-full',
    button: 'h-10 w-24 rounded-md',
    'table-row': 'h-12 w-full rounded',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-muted/50 dark:bg-muted/30',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
```

```typescript
// Spinner.tsx
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeMap = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-12',
  }

  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeMap[size],
        className
      )}
    />
  )
}
```

```typescript
// LoadingCard.tsx
import { Skeleton } from './skeleton'

export function LoadingCard() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-6">
      <div className="flex items-center space-x-4">
        <Skeleton variant="avatar" className="size-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-[200px]" />
          <Skeleton variant="text" className="h-3 w-[150px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-[80%]" />
      </div>
      <Skeleton variant="button" className="w-full sm:w-auto" />
    </div>
  )
}
```

**Usage Example (in any component):**
```typescript
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { LoadingCard } from '@/components/ui/loading-card'
import { Button } from '@/components/ui/button'

export function MyComponent({ data, isLoading }: MyComponentProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    )
  }

  return (
    <div>
      {data.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export function ActionButton({ onClick, isSubmitting }: ActionButtonProps) {
  return (
    <Button disabled={isSubmitting} onClick={onClick}>
      {isSubmitting ? (
        <>
          <Spinner size="sm" className="mr-2" />
          Saving...
        </>
      ) : (
        'Save'
      )}
    </Button>
  )
}
```

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| Loading Patterns | MagicPatterns | https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn | `Skeleton.tsx`, `Spinner.tsx`, `LoadingCard.tsx` |

**Extraction Command:**
```
mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn", fileNames: ["Skeleton.tsx", "Spinner.tsx", "LoadingCard.tsx"])
```

**Adaptation Checklist:**
- [ ] Compare extracted Skeleton with shadcn skeleton (if exists)
- [ ] Use the more feature-complete version or merge best features
- [ ] Replace inline styles with project's Tailwind classes
- [ ] Add proper TypeScript types for all props
- [ ] Import icons from `lucide-react` (Loader2)
- [ ] Ensure dark mode support with `dark:` variants
- [ ] Add variant support (text, card, avatar, button, table-row)
- [ ] Ensure smooth animations (animate-pulse or animate-spin)
- [ ] Make fully responsive (mobile-first)
- [ ] Add JSDoc with usage examples

**Reference Documents:**
- Design Brief: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-design-brief.md](../../planning-artifacts/ux-design/epic-3-onboarding-design-brief.md)
- Component Strategy: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md](../../planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md)

### Library & Framework Requirements

**shadcn Components:**
- May already have skeleton component from shadcn (check and compare)
- No new shadcn installs required for this story

**Icons (lucide-react):**
```typescript
import { Loader2 } from 'lucide-react'
```

**Utility Function:**
```typescript
import { cn } from '@/lib/utils'  // For className merging
```

### File Structure Requirements

```
src/
├── components/ui/
│   ├── skeleton.tsx                        # CREATE/MODIFY: Skeleton component
│   ├── spinner.tsx                         # CREATE: Spinner component
│   ├── loading-card.tsx                    # CREATE: LoadingCard component
│   └── __tests__/
│       ├── skeleton.test.tsx               # CREATE: Skeleton tests
│       ├── spinner.test.tsx                # CREATE: Spinner tests
│       └── loading-card.test.tsx           # CREATE: LoadingCard tests
├── app/[locale]/(auth)/dashboard/
│   └── design-system/
│       └── loading/
│           └── page.tsx                    # CREATE: Demo page
└── locales/
    ├── en.json                             # MODIFY: Add loading translations
    ├── hi.json                             # MODIFY: Add loading translations
    └── bn.json                             # MODIFY: Add loading translations
```

### Testing Requirements

**Unit Tests (Vitest):**
- Skeleton renders with all variants
- Skeleton has animation class
- Skeleton accepts custom className
- Spinner renders with all sizes
- Spinner has animate-spin class
- Spinner accepts custom className
- LoadingCard renders all skeleton elements
- LoadingCard has proper structure

**Integration Tests (Playwright):**
- Not required for this story (pure UI components)
- Integration testing happens when loading components are used in actual features

**Test File Locations:**
- `src/components/ui/__tests__/skeleton.test.tsx`
- `src/components/ui/__tests__/spinner.test.tsx`
- `src/components/ui/__tests__/loading-card.test.tsx`

**Performance Tests:**
- Measure layout shift (CLS should be 0)
- Test animation smoothness on slow connections
- Verify no flash of empty content

### Previous Story Intelligence

**Story 3.6 Learnings - CRITICAL PATTERNS TO FOLLOW:**

1. **Pure UI Component Pattern:**
   ```typescript
   // No 'use client' needed for pure UI components
   import { cn } from '@/lib/utils'

   interface ComponentProps {
     variant?: string
     className?: string
   }

   export function Component({ variant, className }: ComponentProps) {
     return (
       <div className={cn('base-classes', variantStyles[variant], className)}>
         {/* Content */}
       </div>
     )
   }
   ```

2. **Variant Mapping Pattern:**
   ```typescript
   const variantStyles = {
     default: 'default-classes',
     variant1: 'variant1-classes',
     variant2: 'variant2-classes',
   }
   ```

3. **Size Mapping Pattern:**
   ```typescript
   const sizeMap = {
     sm: 'size-4',
     md: 'size-6',
     lg: 'size-12',
   }
   ```

4. **Dark Mode Pattern:**
   - All colors must have `dark:` variants
   - Use semantic color classes (`bg-muted/50`, `dark:bg-muted/30`)
   - Don't hardcode colors

5. **Animation Pattern:**
   ```typescript
   className="animate-pulse"  // For skeletons
   className="animate-spin"   // For spinners
   ```

6. **Responsive Pattern:**
   ```typescript
   className="w-full sm:w-auto"
   ```

### Git Intelligence Summary

**Recent Commits:**
- `be9c12f`: refactor(ui): update EmptyState with MagicPatterns design
- `558c1f4`: feat(ui): add EmptyState design system component with showcase (Story 3.6)
- `41961b8`: refactor(dashboard): simplify layout and auto-create user preferences

**Key Patterns from Recent Work:**
- All UI components in `src/components/ui/`
- Comprehensive dark mode support mandatory
- Pure UI components don't need `'use client'` directive
- Use `cn()` utility for className merging
- Variant props for component flexibility
- JSDoc with usage examples required

### Latest Technical Specifics

**Next.js 15 Patterns:**
- Server Components by default (no directive needed for pure UI)
- Client Component only if using hooks/event handlers
- Skeleton, Spinner, LoadingCard are pure UI (no directive needed)

**Tailwind Animation Classes:**
```typescript
// Pulse animation (skeletons)
className="animate-pulse"

// Spin animation (spinners)
className="animate-spin"

// Custom animation (if needed)
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Icon Pattern (lucide-react):**
```typescript
import { Loader2 } from 'lucide-react'

<Loader2 className="animate-spin size-6" />
```

**Skeleton Composition:**
```typescript
// Multiple skeletons for complex loading states
<div className="space-y-4">
  {Array.from({ length: 3 }).map((_, i) => (
    <LoadingCard key={i} />
  ))}
</div>
```

### Project Context Reference

**Critical Rules from CLAUDE.md:**

1. **Component Location:**
   - Design system components: `src/components/ui/`
   - Skeleton, Spinner, LoadingCard are design system components

2. **Import Pattern:**
   ```typescript
   // ✅ CORRECT
   import { Skeleton } from '@/components/ui/skeleton'
   import { Spinner } from '@/components/ui/spinner'
   import { LoadingCard } from '@/components/ui/loading-card'
   ```

3. **TypeScript Strict Mode:**
   - All props must have explicit types
   - No `any` types allowed
   - Optional props use `?` syntax
   - Extend React.HTMLAttributes when needed

4. **ESLint Rules (Antfu Config):**
   - No semicolons at end of statements
   - Single quotes in JSX attributes
   - No unused imports

5. **Dark Mode Support:**
   - All color classes need `dark:` variants
   - Use semantic colors: `bg-muted/50`, `dark:bg-muted/30`
   - Test in both light and dark modes

6. **Accessibility:**
   - Semantic HTML where applicable
   - No ARIA needed for loading indicators (decorative)
   - Loading states should not block keyboard navigation

7. **Performance:**
   - Minimal layout shift when transitioning
   - Use CSS animations (not JavaScript)
   - Skeleton count should match expected content count

### Story Completion Status

**Ultimate Context Engine Analysis Completed**

This story file contains comprehensive developer guidance derived from:
- ✅ Epic 3 requirements and acceptance criteria (Story 3.7)
- ✅ Story 3.6 implementation patterns (UI component patterns)
- ✅ UX design references (MagicPatterns URL for Loading Patterns)
- ✅ Component strategy document guidance (extract, don't rebuild)
- ✅ Design system patterns (Tailwind animations, dark mode)
- ✅ Git commit history for recent patterns (design system components)
- ✅ Project context (CLAUDE.md, TypeScript strict mode, ESLint rules)
- ✅ Next.js 15 Server Component patterns (pure UI)
- ✅ Lucide React icon patterns (Loader2)
- ✅ Performance considerations (layout shift, animation smoothness)

The developer now has everything needed for flawless implementation without guesswork or ambiguity.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - story prepared with comprehensive context.

### Completion Notes List

Story 3.7 creates a pattern library for loading states. This includes:
1. Skeleton component with multiple variants (text, card, avatar, button, table-row)
2. Spinner component with multiple sizes (sm, md, lg)
3. LoadingCard composite component for common loading patterns
4. All components support dark mode
5. Smooth animations (pulse for skeletons, spin for spinners)
6. Mobile-optimized and responsive
7. Performance-tested for minimal layout shift

Key implementation notes:
- Extract base components from MagicPatterns
- Compare Skeleton with shadcn version (may already exist)
- Use Loader2 icon from lucide-react for Spinner
- All components are pure UI (no 'use client' needed)
- Location: `src/components/ui/` (design system components)
- No database changes required (pure UI components)
- Focus on smooth transitions and minimal layout shift

### File List

**To be Created:**
- `src/components/ui/spinner.tsx`
- `src/components/ui/loading-card.tsx`
- `src/components/ui/__tests__/skeleton.test.tsx`
- `src/components/ui/__tests__/spinner.test.tsx`
- `src/components/ui/__tests__/loading-card.test.tsx`
- `src/app/[locale]/(auth)/dashboard/design-system/loading/page.tsx` (demo)

**To be Modified or Compared:**
- `src/components/ui/skeleton.tsx` (may exist from shadcn, compare and enhance)

**To be Modified (i18n):**
- `src/locales/en.json` (add Loading translations)
- `src/locales/hi.json` (add Loading translations)
- `src/locales/bn.json` (add Loading translations)

**No Database Changes Required:**
- Pure UI components, no backend dependencies
