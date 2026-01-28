# Story 3.2: Onboarding Wizard - Step 2 (Feature Tour)

Status: ready-for-dev

## Story

As a **new user completing onboarding**,
I want **to see a brief overview of the app's key features**,
So that **I understand what I can do with the application**.

## Acceptance Criteria

**AC1: Feature Tour Display**
- **Given** I completed Step 1 (username)
- **When** I advance to Step 2
- **Then** I see a feature tour with 3-4 key features highlighted
- **And** each feature has an icon, title, and brief description
- **And** visuals are clean and professional

**AC2: Feature Card Quality**
- **Given** I am on Step 2
- **When** I view the feature cards
- **Then** features are presented in logical order
- **And** descriptions are concise (1-2 sentences each)
- **And** icons are meaningful and consistent

**AC3: Navigation to Step 3**
- **Given** I am on Step 2
- **When** I click "Continue"
- **Then** I advance to Step 3
- **And** progress indicator shows 2 of 3 complete

**AC4: Mobile Responsiveness**
- **Given** the feature tour
- **When** I view it on mobile
- **Then** features stack vertically
- **And** layout is optimized for smaller screens
- **And** all content is readable without horizontal scrolling

## Tasks / Subtasks

### Task 1: Update Onboarding Page Step Routing (AC1, AC3)
- [x] Modify `app/[locale]/(auth)/onboarding/page.tsx`
  - [x] Add `searchParams` prop to read `?step=` query parameter
  - [x] Check `onboardingStep` from database to determine allowed step
  - [x] Render appropriate component based on step:
    - Step 1 (or no step): `OnboardingUsername`
    - Step 2: `OnboardingFeatureTour`
  - [x] Handle edge cases:
    - If user hasn't completed step 1 but tries step 2 → redirect to step 1
    - If onboarding completed → redirect to dashboard

### Task 2: Extract & Adapt OnboardingFeatureTour Component (AC1, AC2, AC3)
- [x] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken", fileNames: ["OnboardingFeatureTour.tsx"])
  ```
- [x] **ADAPT** extracted code for project:
  - [x] Add `"use client"` directive at top
  - [x] Replace hardcoded text with `useTranslations('Onboarding')` calls
  - [x] Import `ProgressIndicator` from `./ProgressIndicator`
  - [x] Use `useRouter` from `next/navigation` for Continue button
  - [x] Use project's `Button` from `@/components/ui/button`
  - [x] Ensure icons use `lucide-react` imports
- [x] **VERIFY** structure matches project patterns:
  - [x] Progress indicator showing step 2 of 3
  - [x] Header with title and description
  - [x] Feature cards grid (responsive)
  - [x] Continue button → navigate to `/onboarding?step=3`
  - [x] Skip link with ghost variant
- [x] **ALIGN** styling with `OnboardingUsername.tsx`:
  - [x] Same outer gradient background
  - [x] Same card container styling (or wider for 2x2 grid)
  - [x] Same button hover effects
  - [x] Dark mode support via Tailwind `dark:` variants

### Task 3: Adapt FeatureCard Sub-Component (AC1, AC2, AC4)
- [x] Check if `FeatureCard` is included in extracted MagicPatterns code
- [x] If separate file needed, extract it or create inline in `OnboardingFeatureTour.tsx`
- [x] Props interface:
  ```typescript
  interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
  }
  ```
- [x] Styling:
  - [x] Icon container with muted background
  - [x] Title in font-medium
  - [x] Description in text-sm text-muted-foreground
  - [x] Subtle border and rounded corners
  - [x] Hover effect (slight lift or background change)

### Task 4: Define Feature Content (AC2)
- [x] Select 3-4 features relevant to VT SaaS Template:
  - [x] Feature 1: **AI-Powered Chat** (icon: MessageSquare)
    - "Intelligent conversations powered by advanced AI to help you get things done"
  - [x] Feature 2: **Multi-Language Support** (icon: Globe)
    - "Available in English, Hindi, and Bengali for a localized experience"
  - [x] Feature 3: **Secure & Private** (icon: Shield)
    - "Your data is protected with enterprise-grade security and encryption"
  - [x] Feature 4: **Fast & Responsive** (icon: Zap)
    - "Lightning-fast performance optimized for all devices"
- [x] All content via i18n translation keys

### Task 5: Add i18n Translations (AC1, AC2, AC3)
- [x] Add to `src/locales/en.json`:
  ```json
  "step2Title": "Discover What You Can Do",
  "step2Description": "Here are some of the key features you'll have access to",
  "feature1Title": "AI-Powered Chat",
  "feature1Description": "Intelligent conversations powered by advanced AI to help you get things done",
  "feature2Title": "Multi-Language Support",
  "feature2Description": "Available in English, Hindi, and Bengali for a localized experience",
  "feature3Title": "Secure & Private",
  "feature3Description": "Your data is protected with enterprise-grade security and encryption",
  "feature4Title": "Fast & Responsive",
  "feature4Description": "Lightning-fast performance optimized for all devices"
  ```
- [x] Add same keys to `hi.json` and `bn.json` with translated values

### Task 6: Implement Mobile Responsiveness (AC4)
- [x] Feature grid:
  - Desktop: `grid-cols-2` (2x2 layout)
  - Mobile: `grid-cols-1` (single column stack)
- [x] Use responsive Tailwind classes: `grid grid-cols-1 md:grid-cols-2 gap-4`
- [x] Ensure touch targets are large enough (min 44x44px)
- [x] Test on common mobile widths (320px, 375px, 414px)

### Task 7: Handle Navigation Flow (AC3)
- [x] On "Continue" click:
  - [x] Navigate to `/onboarding?step=3` using `router.push()`
- [x] On "Skip for now" click:
  - [x] Same behavior - navigate to `/onboarding?step=3`
- [x] No database update needed (Step 2 is informational only)
- [x] Step 3 component will update `onboarding_step` to 2 when it loads
  - Note: The step tracking shows progress, but actual save happens on form completion

### Task 8: Write Unit Tests
- [x] Test `OnboardingFeatureTour` component:
  - [x] Renders correct number of feature cards (4)
  - [x] All feature cards display title, description, icon
  - [x] Progress indicator shows step 2 of 3
  - [x] Continue button is visible and clickable
  - [x] Skip link is visible
- [x] Test mobile responsiveness (use viewport media query mocks)
- [x] Test navigation calls `router.push` with correct path

## Dev Notes

### Architecture Compliance

**Component Organization (Following Story 3.1 Pattern):**
- Component location: `src/components/onboarding/OnboardingFeatureTour.tsx`
- Reuse existing: `ProgressIndicator.tsx` (already created)
- Follow same visual structure as `OnboardingUsername.tsx`

**No Database Changes:**
- Step 2 is informational - no data to save
- Step routing handled via URL query param `?step=2`
- Database `onboarding_step` will be updated in Step 3

**Navigation Pattern:**
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

// Continue to step 3
router.push('/onboarding?step=3')
```

### UX Design References

**CRITICAL: Design Reference Available**

| Screen | MagicPatterns URL | Files |
|--------|-------------------|-------|
| Step 2: Feature Tour | [View](https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken) | `OnboardingFeatureTour.tsx` |

**REQUIRED: Extract Code from MagicPatterns First**

```
mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken", fileNames: ["OnboardingFeatureTour.tsx"])
```

**Implementation Approach:**
1. **Extract** the component code from MagicPatterns using the command above
2. **Adapt** the extracted code to match project patterns:
   - Add `"use client"` directive
   - Replace any custom inputs with shadcn components
   - Wire up `useTranslations` for all hardcoded text
   - Use `useRouter` from `next/navigation` for navigation
   - Ensure styling matches existing `OnboardingUsername.tsx` patterns
   - Import `ProgressIndicator` from the same folder

**Visual Consistency Checklist:**
- [ ] Same outer container: `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`
- [ ] Same card container: `max-w-md rounded-2xl border bg-white p-8 shadow-xl`
- [ ] Same header styling: `text-2xl font-bold tracking-tight`
- [ ] Same button styling: `w-full gap-2 shadow-md transition-all hover:-translate-y-0.5`
- [ ] Same skip link styling: `variant="ghost" text-sm text-muted-foreground`

### Library & Framework Requirements

**Icons (lucide-react - already installed):**
```typescript
import { MessageSquare, Globe, Shield, Zap, ArrowRight } from 'lucide-react'
```

**shadcn Components (already installed):**
- `Button` - for Continue and Skip actions
- No new installations needed for this story

### File Structure Requirements

```
src/
├── app/[locale]/(auth)/onboarding/
│   └── page.tsx                          # MODIFY: Add step routing logic
├── components/onboarding/
│   ├── OnboardingUsername.tsx            # EXISTING (no changes)
│   ├── OnboardingFeatureTour.tsx         # CREATE: Step 2 component
│   ├── ProgressIndicator.tsx             # EXISTING (no changes)
│   └── UsernameInput.tsx                 # EXISTING (no changes)
└── locales/
    ├── en.json                           # MODIFY: Add step 2 translations
    ├── hi.json                           # MODIFY: Add step 2 translations
    └── bn.json                           # MODIFY: Add step 2 translations
```

### Testing Requirements

**Unit Tests (Vitest):**
- Component renders all feature cards
- Progress indicator shows correct step
- Buttons are functional
- Mobile layout adjustments work

**Test File Location:**
- `src/components/onboarding/__tests__/OnboardingFeatureTour.test.tsx`

**Test Coverage Focus:**
- Rendering correctness
- i18n translations display
- Navigation behavior
- Responsive layout

### Previous Story Intelligence

**Story 3.1 Learnings - CRITICAL PATTERNS TO FOLLOW:**

1. **Component Structure Pattern:**
   ```typescript
   'use client'

   import { ArrowRight } from 'lucide-react'
   import { useRouter } from 'next/navigation'
   import { useTranslations } from 'next-intl'

   import { Button } from '@/components/ui/button'
   import { ProgressIndicator } from './ProgressIndicator'

   export function OnboardingFeatureTour() {
     const t = useTranslations('Onboarding')
     const router = useRouter()

     const handleContinue = () => {
       router.push('/onboarding?step=3')
     }

     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
         {/* Content */}
       </div>
     )
   }
   ```

2. **Card Container Pattern (match exactly):**
   ```jsx
   <div className="w-full max-w-md rounded-2xl border border-slate-100/50 bg-white p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900 md:p-10">
   ```

   Note: For feature tour, may need `max-w-lg` or `max-w-xl` to fit 2x2 grid

3. **Button Pattern:**
   ```jsx
   <Button
     className="w-full gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
     onClick={handleContinue}
   >
     <span>{t('continue')}</span>
     <ArrowRight className="size-4" />
   </Button>
   ```

4. **Skip Link Pattern:**
   ```jsx
   <Button
     type="button"
     variant="ghost"
     className="w-full text-sm text-muted-foreground hover:text-foreground"
     onClick={handleSkip}
   >
     {t('skipForNow')}
   </Button>
   ```

5. **Files Created in Story 3.1:**
   - `src/components/onboarding/OnboardingUsername.tsx` - REFERENCE for structure
   - `src/components/onboarding/ProgressIndicator.tsx` - REUSE directly
   - `src/components/onboarding/UsernameInput.tsx` - Not needed for Step 2
   - `src/app/[locale]/(auth)/onboarding/page.tsx` - MODIFY for step routing

### Page.tsx Modification Pattern

**Current page.tsx** (needs modification):
```typescript
// For now, we only have Step 1, so always show it
// In future stories, we'll check onboardingStep and redirect accordingly
return <OnboardingUsername />
```

**Required changes for Step 2:**
```typescript
import { OnboardingFeatureTour } from '@/components/onboarding/OnboardingFeatureTour'

type Props = {
  searchParams: Promise<{ step?: string }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams
  const step = params.step ? parseInt(params.step, 10) : 1

  // ... existing auth and profile checks ...

  // Determine which step to show
  const onboardingStep = profile[0]?.onboardingStep ?? 0

  // Validate step access (can't skip ahead)
  if (step > onboardingStep + 1) {
    // User trying to skip - redirect to their current step
    redirect(`/onboarding?step=${onboardingStep + 1}`)
  }

  // Render appropriate component
  switch (step) {
    case 2:
      return <OnboardingFeatureTour />
    case 1:
    default:
      return <OnboardingUsername />
  }
}
```

### Git Intelligence Summary

**Recent Commit (4f77988):**
- feat(onboarding): implement username selection wizard (Story 3.1)
- Established all patterns for onboarding components
- Created database schema with `onboarding_step` field
- Set up route at `/onboarding` with auth protection

**Key Learnings:**
- Story 3.1 was implemented from scratch - **Story 3.2 should extract from MagicPatterns first**
- All UI text via `useTranslations` hook
- Router navigation using `useRouter` from `next/navigation`
- Consistent styling across dark/light modes using Tailwind dark: variants
- After extraction, adapt to match established patterns

### Project Context Reference

**Critical Rules (from project-context.md):**

1. **NEVER Hardcode User-Facing Text:**
   ```typescript
   // ❌ WRONG
   <h1>Discover What You Can Do</h1>

   // ✅ CORRECT
   const t = useTranslations('Onboarding')
   <h1>{t('step2Title')}</h1>
   ```

2. **NEVER Add 'use client' Without Reason:**
   - Step 2 component NEEDS `'use client'` because:
     - Uses `useRouter` for navigation
     - Uses `useTranslations` hook
     - Has onClick event handlers

3. **NEVER Use Relative Imports:**
   ```typescript
   // ✅ CORRECT
   import { Button } from '@/components/ui/button'
   import { ProgressIndicator } from './ProgressIndicator'  // Same folder OK
   ```

4. **TypeScript Strict Mode:**
   - All props must be typed
   - No implicit any
   - Check for undefined when accessing arrays/objects

### Feature Content Decisions

**Recommended 4 Features for VT SaaS Template:**

| Feature | Icon | Title Key | Description Key |
|---------|------|-----------|-----------------|
| AI Chat | `MessageSquare` | `feature1Title` | `feature1Description` |
| Multi-Language | `Globe` | `feature2Title` | `feature2Description` |
| Security | `Shield` | `feature3Title` | `feature3Description` |
| Performance | `Zap` | `feature4Title` | `feature4Description` |

These features represent actual capabilities of the VT SaaS Template and provide value preview to users.

### Story Completion Status

**Ultimate Context Engine Analysis Completed**

This story file contains comprehensive developer guidance derived from:
- ✅ Epic 3 requirements and acceptance criteria
- ✅ Story 3.1 implementation patterns and learnings
- ✅ Existing component code analysis (`OnboardingUsername.tsx`, `ProgressIndicator.tsx`)
- ✅ Page routing structure analysis (`onboarding/page.tsx`)
- ✅ i18n translation patterns from locales files
- ✅ UX design references (MagicPatterns URL)
- ✅ Component strategy document guidance
- ✅ Git commit history for recent patterns
- ✅ Project context (critical rules, TypeScript patterns)

The developer now has everything needed for flawless implementation without guesswork or ambiguity.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - implementation completed without issues.

### Completion Notes List

**Implementation Summary:**
- Successfully extracted OnboardingFeatureTour component from MagicPatterns
- Adapted component to match project patterns (OnboardingUsername.tsx)
- Added full i18n support for en, hi, bn locales
- Implemented step routing in onboarding page with validation
- All 8 unit tests passing (rendering, navigation, responsive layout)
- Build successful with no errors
- Type checking passed
- Linting passed (no errors in new code)

**Key Adaptations from MagicPatterns:**
- Changed `interface` to `type` for FeatureCardProps (project convention)
- Replaced custom Button with shadcn Button component
- Added full dark mode support with Tailwind dark: variants
- Integrated ProgressIndicator component from Step 1
- Used project's gradient background pattern
- All text via useTranslations('Onboarding') hook
- Responsive grid: grid-cols-1 md:grid-cols-2

**Files Modified/Created:**
- Created: `src/components/onboarding/OnboardingFeatureTour.tsx`
- Created: `src/components/onboarding/__tests__/OnboardingFeatureTour.test.tsx`
- Modified: `src/app/[locale]/(auth)/onboarding/page.tsx` (added step routing)
- Modified: `src/locales/en.json` (added 8 translation keys)
- Modified: `src/locales/hi.json` (added 8 translation keys)
- Modified: `src/locales/bn.json` (added 8 translation keys)

**Test Results:**
- Unit Tests: 8/8 passing
- All Project Tests: 198/198 passing
- Build: Success
- Type Check: No errors
- Lint: No errors in new code

**Ready for:**
- Story 3.3 implementation (Step 3: User Preferences)
- Visual verification via Playwright if desired
- Integration testing with full onboarding flow

### File List

**Created:**
- `src/components/onboarding/OnboardingFeatureTour.tsx` (122 lines)
- `src/components/onboarding/__tests__/OnboardingFeatureTour.test.tsx` (125 lines)

**Modified:**
- `src/app/[locale]/(auth)/onboarding/page.tsx` (added step routing logic)
- `src/locales/en.json` (added step2Title, step2Description, feature1-4 keys)
- `src/locales/hi.json` (added Hindi translations)
- `src/locales/bn.json` (added Bengali translations)

---

## Desk Check

**Status:** changes_requested
**Date:** 2026-01-26 08:54
**Full Report:** [View Report](../../screenshots/story-3.2/desk-check-report.md)

### Story 3.2 Visual Quality: ✅ APPROVED
Story 3.2's visual implementation is **excellent** and meets all design criteria. All 4 feature cards display correctly with proper responsive layout, dark mode support, and polished hover effects.

### Critical Issue in Story 3.1: ⚠️ BLOCKER DETECTED
**Continue button in Step 1 does not submit the form**, preventing users from reaching Step 2 through normal flow. The button click does not trigger the API call to `/api/profile/update-username`.

**Evidence:**
- Network monitoring showed NO request when Continue button clicked
- Manual API call via console succeeds: `{success: true}`
- Form validation shows "Available" but submission fails silently

### Issues to Address (Story 3.1 Fix Required)
1. [CRITICAL] Fix Continue button form submission in `OnboardingUsername.tsx`
   - Button click must trigger form submit
   - API call to `/api/profile/update-username` must execute
   - Navigation to Step 2 should occur after successful API response

**Story 3.2 is ready for code review once Story 3.1 blocker is resolved.**
