# Epic 3: User Onboarding & Welcome - Component Strategy

**Date:** 2026-01-21
**Design Tool:** MagicPatterns (React/TypeScript output)

---

> **CRITICAL: EXTRACT CODE, DO NOT REBUILD**
>
> MagicPatterns designs contain **production-ready React/TypeScript**.
> Use `mcp__magic-patterns__read_files` to extract code directly.
> Only adapt for project patterns (Supabase auth, react-hook-form, etc.)

---

## Quick Reference

### 1. Install shadcn Components

```bash
npx shadcn@latest add progress switch select
```

**Already Installed (from Epic-2):** button, input, label, form, toast, card, checkbox, avatar, alert

### 2. Extract Code from MagicPatterns

| Design | MagicPatterns URL | Primary Files | Key Elements |
|--------|-------------------|---------------|--------------|
| Step 1: Username | [View](https://www.magicpatterns.com/c/8dywtcpmne2a3vzohcewiu) | `OnboardingUsername.tsx`, `UsernameInput.tsx`, `ProgressIndicator.tsx` | Username availability check, progress bar |
| Step 2: Feature Tour | [View](https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken) | `OnboardingFeatureTour.tsx` | Feature cards grid, icons |
| Step 3: Preferences | [View](https://www.magicpatterns.com/c/1urfca8jgldest2yvquw6l) | `OnboardingPreferences.tsx`, `Switch.tsx`, `Select.tsx` | Toggle, dropdown, success state |
| Dashboard Welcome | [View](https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq) | `WelcomeDashboard.tsx`, `ActionCard.tsx` | Welcome message, action cards |
| EmptyState | [View](https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa) | `EmptyState.tsx` | Reusable component with variants |
| Loading Patterns | [View](https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn) | `Skeleton.tsx`, `Spinner.tsx` | Skeleton variants, spinner sizes |

**Workflow:**
1. Use `mcp__magic-patterns__read_files` to extract the component code
2. Adapt styling to use project's existing shadcn components
3. Add `"use client"` directive for Next.js
4. Wire up to Supabase for user profile updates

---

## Component Mapping

| UI Element | Source | Component | Variant/Props | Notes |
|------------|--------|-----------|---------------|-------|
| Progress bar | MagicPatterns | `ProgressIndicator` | `currentStep`, `totalSteps` | Extract from Step 1 design |
| Username input | Epic-2 + MagicPatterns | `UsernameInput` | Availability check built-in | Reuse from Epic-2, compare with Step 1 |
| Feature card | MagicPatterns | Custom `FeatureCard` | `icon`, `title`, `description` | Extract from Step 2 design |
| Toggle switch | shadcn | `Switch` | - | Install, use for notifications |
| Language select | shadcn | `Select` | - | Install, use for language preference |
| Action card | MagicPatterns | `ActionCard` | `icon`, `title`, `description`, `cta` | Extract from Dashboard design |
| Empty state | MagicPatterns | `EmptyState` | `icon`, `title`, `description`, `action`, `variant` | Extract from EmptyState design |
| Skeleton loader | MagicPatterns | `Skeleton` | `variant`: card, text, avatar, table | Extract from Loading design |
| Spinner | MagicPatterns | `Spinner` | `size`: sm, md, lg | Extract from Loading design |
| Skip link | Custom | `<button>` | ghost variant | "Skip for now" styling |

---

## shadcn Components

### Progress (to install)

**Usage:** Onboarding step indicator

```tsx
import { Progress } from "@/components/ui/progress"

// Visual progress bar
<Progress value={(currentStep / totalSteps) * 100} className="h-2" />

// Or use custom ProgressIndicator for step dots
```

### Switch (to install)

**Usage:** Email notifications toggle in Step 3

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="notifications">Email notifications</Label>
    <p className="text-sm text-muted-foreground">Receive updates and alerts</p>
  </div>
  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
</div>
```

### Select (to install)

**Usage:** Language preference dropdown in Step 3

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select value={language} onValueChange={setLanguage}>
  <SelectTrigger>
    <SelectValue placeholder="Select language" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="en">English</SelectItem>
    <SelectItem value="hi">Hindi</SelectItem>
    <SelectItem value="bn">Bengali</SelectItem>
  </SelectContent>
</Select>
```

---

## Custom Components to EXTRACT

### 1. ProgressIndicator

**Purpose:** Visual step indicator showing current progress in wizard

**Source:** Extract from [Step 1 Design](https://www.magicpatterns.com/c/8dywtcpmne2a3vzohcewiu) - `ProgressIndicator.tsx`

**Location:** `src/components/onboarding/progress-indicator.tsx`

```typescript
interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

// Features:
// - Shows "Step X of Y" text
// - Visual dots or bar with completed/active/pending states
// - Completed steps filled, current step highlighted, pending steps outlined
```

---

### 2. FeatureCard

**Purpose:** Display a single feature in the feature tour

**Source:** Extract from [Step 2 Design](https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken) - `OnboardingFeatureTour.tsx`

**Location:** `src/components/onboarding/feature-card.tsx`

```typescript
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

// Features:
// - Icon (24px, colored)
// - Title (font-medium)
// - Description (text-sm, muted)
// - Subtle hover effect
// - Responsive: 2x2 grid on desktop, stack on mobile
```

---

### 3. ActionCard

**Purpose:** Clickable card for dashboard "Getting Started" actions

**Source:** Extract from [Dashboard Design](https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq) - `ActionCard.tsx`

**Location:** `src/components/dashboard/action-card.tsx`

```typescript
interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  completed?: boolean
}

// Features:
// - Icon on left
// - Title + description
// - CTA button (primary or secondary)
// - Optional completed state (checkmark, muted styling)
```

---

### 4. EmptyState

**Purpose:** Reusable empty state for any list/data view with no items

**Source:** Extract from [EmptyState Design](https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa) - `EmptyState.tsx`

**Location:** `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'search' | 'error'
}

// Features:
// - Centered layout
// - Icon (64px, monochrome or colored for error)
// - Headline + description
// - Optional CTA button
// - Variants: default, search (no results), error (with retry)
```

---

### 5. Skeleton

**Purpose:** Content placeholder during loading

**Source:** Extract from [Loading Design](https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn) - `Skeleton.tsx`

**Location:** `src/components/ui/skeleton.tsx`

```typescript
interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button'
  className?: string
}

// Features:
// - Pulse/shimmer animation
// - Variants match content shapes
// - Works in light and dark mode
```

**Note:** shadcn has a basic Skeleton component. Compare with extracted version and use whichever is more complete.

---

### 6. Spinner

**Purpose:** Loading indicator for actions and page loads

**Source:** Extract from [Loading Design](https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn) - `Spinner.tsx`

**Location:** `src/components/ui/spinner.tsx`

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Features:
// - Uses Loader2 icon with animate-spin
// - Sizes: sm (16px), md (24px), lg (48px)
// - Can be used inline or centered
```

---

## What NOT to Do

| Don't | Instead |
|-------|---------|
| Build onboarding layouts from scratch | Extract from MagicPatterns designs |
| Create custom progress indicator | Extract `ProgressIndicator.tsx` from Step 1 |
| Design feature cards from scratch | Extract from Step 2 design |
| Build skeleton animations manually | Extract `Skeleton.tsx` with CSS animations |
| Write toggle/switch component | Install shadcn `Switch` component |
| Create dropdown from scratch | Install shadcn `Select` component |

---

## Implementation Notes

### Onboarding Flow State
- Store onboarding progress in Supabase user metadata or profiles table
- Fields: `onboarding_completed`, `onboarding_step`, `username`, `language`, `email_notifications`

### Skip & Resume Logic
- If user skips, save `onboarding_completed: false` and current step
- On return, check if `onboarding_completed === false` and resume
- Show subtle "Complete setup" prompt on dashboard

### Dashboard Transition
- Check user activity count to determine welcome vs regular state
- Transition criteria: user has completed at least one meaningful action
- Getting Started cards can be dismissed individually

### Reusable Components
- `EmptyState` and `Skeleton` go in `src/components/ui/` (design system)
- Onboarding-specific components go in `src/components/onboarding/`
- Dashboard components go in `src/components/dashboard/`

### Icon Reference

All icons from `lucide-react`:

```tsx
import {
  Loader2,      // Spinner
  User,         // Profile action
  Compass,      // Explore action
  MessageSquare,// Chat action
  Zap,          // Feature: Fast
  Shield,       // Feature: Secure
  BarChart3,    // Feature: Analytics
  Check,        // Completed state
  ChevronRight, // CTA arrow
  Inbox,        // Empty state default
  Search,       // Empty state search
  AlertTriangle,// Empty state error
  Globe,        // Language
  Bell,         // Notifications
} from 'lucide-react'
```

---

*Generated by designer-founder workflow on 2026-01-21*
