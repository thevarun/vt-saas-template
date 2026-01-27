# Story 3.5: Dashboard Welcome State

Status: ready-for-dev

## Story

As a **new user landing on the dashboard for the first time**,
I want **to see a welcoming experience with guidance**,
So that **I know what to do next and feel oriented**.

## Acceptance Criteria

**AC1: Personalized Welcome Message**
- **Given** I am a new user with no activity
- **When** I land on the dashboard
- **Then** I see a personalized welcome message with my name/username
- **And** I see a "Getting Started" section with suggested actions
- **And** the page feels welcoming, not empty

**AC2: Suggested Actions Display**
- **Given** the dashboard welcome state
- **When** I view suggested actions
- **Then** I see 2-3 clear next steps
- **And** each action has a title, description, and CTA button
- **And** actions are relevant to getting started

**AC3: Action Completion Tracking**
- **Given** I complete a suggested action
- **When** I return to the dashboard
- **Then** the completed action is marked or removed
- **And** new suggestions may appear based on progress

**AC4: Transition to Regular Dashboard**
- **Given** I have used the app for a while
- **When** I have meaningful activity/data
- **Then** welcome state transitions to regular dashboard
- **And** data and activity are prominently displayed
- **And** getting started section is minimized or hidden

**AC5: Mobile Responsiveness**
- **Given** the welcome state
- **When** I view it on mobile
- **Then** layout is optimized for mobile
- **And** CTAs are touch-friendly
- **And** content is scannable

## Tasks / Subtasks

### Task 1: Extract & Adapt Dashboard Welcome Components (AC1, AC2)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq", fileNames: ["WelcomeDashboard.tsx", "ActionCard.tsx", "Sidebar.tsx", "DashboardLayout.tsx"])
  ```
- [ ] **CREATE** dashboard components directory:
  - [ ] Create `src/components/dashboard/` directory
  - [ ] Extract and adapt `WelcomeDashboard.tsx` as main component
  - [ ] Extract and adapt `ActionCard.tsx` as reusable action card
  - [ ] Review `Sidebar.tsx` and `DashboardLayout.tsx` (may already exist)
- [ ] **ADAPT** extracted code for project:
  - [ ] Add `"use client"` directive where needed
  - [ ] Replace hardcoded text with `useTranslations('Dashboard')` calls
  - [ ] Use project's `Button` from `@/components/ui/button`
  - [ ] Use project's `Card` from `@/components/ui/card`
  - [ ] Import icons from `lucide-react` (User, Compass, MessageSquare, etc.)
  - [ ] Wire up action buttons to navigate to relevant sections
- [ ] **ALIGN** styling with project design system:
  - [ ] Use Tailwind classes consistent with auth and onboarding pages
  - [ ] Dark mode support via `dark:` variants
  - [ ] Responsive breakpoints (mobile-first)
  - [ ] Match card styling from existing dashboard page

### Task 2: Define Welcome State Detection Logic (AC1, AC4)
- [ ] Determine "new user" criteria:
  - [ ] User has completed onboarding (user_preferences exists)
  - [ ] User has no chat threads (threads table empty for user)
  - [ ] User created account within last 7 days
  - [ ] Store welcome state dismissed preference (optional)
- [ ] Create utility function `isNewUser()`:
  - [ ] Check database for user activity indicators
  - [ ] Return boolean for welcome state vs regular dashboard
  - [ ] Located in `src/lib/dashboard-utils.ts` or similar

### Task 3: Update Dashboard Page with Welcome State (AC1, AC2, AC4)
- [ ] Modify `src/app/[locale]/(auth)/dashboard/page.tsx`:
  - [ ] Add welcome state detection logic
  - [ ] Conditionally render `WelcomeDashboard` or existing dashboard
  - [ ] Pass user data (name, username, email) to WelcomeDashboard
  - [ ] Fetch user activity data (thread count, etc.)
  - [ ] Maintain existing VerificationToast and TitleBar when not in welcome state
- [ ] Keep existing onboarding redirect logic (lines 22-32)
- [ ] Use Server Component for data fetching

### Task 4: Design Getting Started Actions (AC2, AC3)
- [ ] Define 2-3 suggested actions:
  - [ ] **Action 1**: "Start a Conversation" - Navigate to /chat
    - Icon: MessageSquare
    - Description: "Try our AI health companion"
  - [ ] **Action 2**: "Complete Your Profile" - Navigate to /dashboard/user-profile
    - Icon: User
    - Description: "Add more details about yourself"
  - [ ] **Action 3**: "Explore Features" - Navigate to /dashboard or docs
    - Icon: Compass
    - Description: "Learn what you can do"
- [ ] Make actions data-driven (easy to add/remove/reorder)
- [ ] Actions defined in component or fetched from config

### Task 5: Implement Action Card Component (AC2, AC3)
- [ ] Create `src/components/dashboard/ActionCard.tsx`:
  ```typescript
  interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    completed?: boolean;
  }
  ```
- [ ] Features:
  - [ ] Icon on left (24px, colored)
  - [ ] Title + description layout
  - [ ] CTA button (primary variant)
  - [ ] Optional completed state (checkmark, muted styling)
  - [ ] Hover effects
  - [ ] Responsive: stack on mobile
- [ ] Use shadcn Card as base
- [ ] Wire onAction to Next.js router navigation

### Task 6: Add Action Completion Tracking (AC3)
- [ ] **Option A**: Client-side state (simple, no persistence)
  - [ ] Track completed actions in React state
  - [ ] Mark action as completed on button click
  - [ ] Persist in localStorage (optional)
- [ ] **Option B**: Server-side tracking (persistent)
  - [ ] Add `completed_actions` JSON column to user_preferences
  - [ ] API route to update completed actions
  - [ ] Fetch on page load
  - [ ] Update on action completion
- [ ] Choose Option A for MVP (simpler, faster)
- [ ] Actions naturally complete when user navigates and returns

### Task 7: Add i18n Translations (AC1, AC2)
- [ ] Add to `src/locales/en.json`:
  ```json
  "Dashboard": {
    "welcomeTitle": "Welcome, {name}!",
    "welcomeDescription": "Let's get you started with your health journey",
    "gettingStartedTitle": "Getting Started",
    "actionStartChat": "Start a Conversation",
    "actionStartChatDesc": "Try our AI health companion",
    "actionCompleteProfile": "Complete Your Profile",
    "actionCompleteProfileDesc": "Add more details about yourself",
    "actionExploreFeatures": "Explore Features",
    "actionExploreFeaturesDesc": "Learn what you can do",
    "actionButtonLabel": "Get Started"
  }
  ```
- [ ] Add same keys to `hi.json` with Hindi translations
- [ ] Add same keys to `bn.json` with Bengali translations

### Task 8: Mobile Optimization (AC5)
- [ ] Test on mobile viewports:
  - [ ] Welcome message responsive (text sizes, spacing)
  - [ ] Action cards stack vertically on mobile
  - [ ] CTA buttons full-width on mobile
  - [ ] Touch-friendly spacing (min 44px height)
  - [ ] No horizontal scroll
- [ ] Use Tailwind responsive classes:
  - [ ] `flex-col md:flex-row` for card layouts
  - [ ] `text-xl md:text-2xl` for headings
  - [ ] `w-full md:w-auto` for buttons
  - [ ] `p-4 md:p-6` for padding adjustments

### Task 9: Write Unit Tests
- [ ] Test `WelcomeDashboard` component:
  - [ ] Renders welcome message with user name
  - [ ] Renders Getting Started section
  - [ ] Renders 2-3 action cards
  - [ ] Action buttons call navigation on click
  - [ ] Completed actions marked visually
- [ ] Test `ActionCard` component:
  - [ ] Renders icon, title, description, button
  - [ ] Calls onAction on button click
  - [ ] Shows completed state when completed=true
  - [ ] Responsive layout
- [ ] Test `isNewUser()` utility:
  - [ ] Returns true for new users
  - [ ] Returns false for users with activity
  - [ ] Handles edge cases (no data, errors)

### Task 10: Write Integration Tests
- [ ] E2E test for dashboard welcome state:
  - [ ] New user completes onboarding
  - [ ] Lands on dashboard
  - [ ] Sees welcome message with name
  - [ ] Sees Getting Started section
  - [ ] Sees 2-3 action cards
  - [ ] Clicks action button, navigates correctly
  - [ ] Returns to dashboard, sees updated state
- [ ] E2E test for regular dashboard:
  - [ ] User with activity lands on dashboard
  - [ ] Does NOT see welcome state
  - [ ] Sees regular dashboard content

## Dev Notes

### Architecture Compliance

**Component Organization:**
- New directory: `src/components/dashboard/`
- Components:
  - `WelcomeDashboard.tsx` - Main welcome state component
  - `ActionCard.tsx` - Reusable action card component
- Existing: `src/app/[locale]/(auth)/dashboard/page.tsx` - MODIFY to add welcome state logic

**Dashboard Detection Logic:**
```typescript
// src/lib/dashboard-utils.ts
export async function isNewUser(userId: string): Promise<boolean> {
  // Check if user has any chat threads
  const threadCount = await db
    .select({ count: count() })
    .from(threads)
    .where(eq(threads.userId, userId));

  // New user if no threads
  return threadCount[0]?.count === 0;
}
```

**Dashboard Page Pattern:**
```typescript
// src/app/[locale]/(auth)/dashboard/page.tsx
const DashboardIndexPage = async () => {
  const user = await getUser(); // Existing logic
  const isNew = await isNewUser(user.id);

  if (isNew) {
    return <WelcomeDashboard user={user} />;
  }

  return (
    <>
      {/* Existing dashboard content */}
    </>
  );
};
```

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| Dashboard Welcome State | MagicPatterns | https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq | `WelcomeDashboard.tsx`, `ActionCard.tsx`, `Sidebar.tsx`, `DashboardLayout.tsx` |

**Extraction Command:**
```
mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq", fileNames: ["WelcomeDashboard.tsx", "ActionCard.tsx", "Sidebar.tsx", "DashboardLayout.tsx"])
```

**Adaptation Checklist:**
- [ ] Replace inline styles with project's Tailwind classes
- [ ] Add `"use client"` directive if component uses hooks
- [ ] Wire up action buttons to Next.js router navigation
- [ ] Add proper TypeScript types for props
- [ ] Integrate with project's i18n using `useTranslations`
- [ ] Use project's shadcn components (Button, Card, etc.)
- [ ] Match styling of existing dashboard page
- [ ] Ensure dark mode support with `dark:` variants
- [ ] Make fully responsive (mobile-first)

**Reference Documents:**
- Design Brief: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-design-brief.md](../../planning-artifacts/ux-design/epic-3-onboarding-design-brief.md)
- Component Strategy: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md](../../planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md)

### Library & Framework Requirements

**shadcn Components (Already Installed):**
- button, card, toast (from Epic 2)
- No new shadcn components needed

**Icons (lucide-react):**
```typescript
import { User, Compass, MessageSquare, Check, ArrowRight } from 'lucide-react'
```

**Navigation:**
```typescript
import { useRouter } from 'next/navigation'
// Use router.push() for client-side navigation
```

### File Structure Requirements

```
src/
├── app/[locale]/(auth)/dashboard/
│   └── page.tsx                          # MODIFY: Add welcome state logic
├── components/dashboard/
│   ├── WelcomeDashboard.tsx              # CREATE: Main welcome component
│   ├── ActionCard.tsx                    # CREATE: Reusable action card
│   └── __tests__/
│       ├── WelcomeDashboard.test.tsx     # CREATE
│       └── ActionCard.test.tsx           # CREATE
├── lib/
│   └── dashboard-utils.ts                # CREATE: isNewUser() utility
└── locales/
    ├── en.json                           # MODIFY: Add Dashboard translations
    ├── hi.json                           # MODIFY: Add Dashboard translations
    └── bn.json                           # MODIFY: Add Dashboard translations
```

### Testing Requirements

**Unit Tests (Vitest):**
- WelcomeDashboard component renders correctly
- ActionCard component renders and handles clicks
- isNewUser() utility logic
- Responsive behavior

**Integration Tests (Playwright):**
- New user sees welcome state
- Existing user sees regular dashboard
- Action buttons navigate correctly
- Welcome state transitions to regular dashboard

**Test File Location:**
- `src/components/dashboard/__tests__/WelcomeDashboard.test.tsx`
- `src/components/dashboard/__tests__/ActionCard.test.tsx`
- `src/lib/__tests__/dashboard-utils.test.ts`

### Previous Story Intelligence

**Story 3.1-3.3 Learnings - CRITICAL PATTERNS TO FOLLOW:**

1. **Component Structure Pattern:**
   ```typescript
   'use client'  // If uses hooks or event handlers

   import { useRouter } from 'next/navigation'
   import { useTranslations } from 'next-intl'
   import { Button } from '@/components/ui/button'
   import { Card } from '@/components/ui/card'

   export function WelcomeDashboard({ user }) {
     const t = useTranslations('Dashboard')
     const router = useRouter()

     return (
       <div className="space-y-6">
         {/* Content */}
       </div>
     )
   }
   ```

2. **Server Component Data Fetching (Dashboard Page):**
   ```typescript
   // page.tsx is a Server Component
   const DashboardIndexPage = async () => {
     const cookieStore = await cookies();
     const supabase = createClient(cookieStore);
     const { data: { user } } = await supabase.auth.getUser();

     // Fetch user activity data
     const isNew = await isNewUser(user.id);

     return isNew ? <WelcomeDashboard /> : <RegularDashboard />;
   };
   ```

3. **Card Styling Pattern (from Onboarding):**
   ```jsx
   <Card className="rounded-2xl border border-slate-100/50 bg-white p-6 shadow-xl dark:border-slate-800/50 dark:bg-slate-900">
   ```

4. **Button Pattern (from Onboarding):**
   ```jsx
   <Button
     className="w-full gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
     onClick={handleAction}
   >
     <span>{t('actionLabel')}</span>
     <ArrowRight className="size-4" />
   </Button>
   ```

5. **Responsive Grid Pattern:**
   ```jsx
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
     {actions.map(action => <ActionCard key={action.id} {...action} />)}
   </div>
   ```

### Git Intelligence Summary

**Recent Commits:**
- `f795d44`: refactor(onboarding): redesign state management with isolated user_preferences table
- `adb0d67`: feat(onboarding): implement feature tour wizard step (Story 3.2)

**Key Patterns from Recent Work:**
- All onboarding components use same visual structure
- Database uses `health_companion.user_preferences` table (NOT public.user_profiles)
- Hard navigation (`window.location.href`) used when needed for server refresh
- Comprehensive i18n for all UI text
- Dark mode support mandatory
- Responsive design (mobile-first)

**Database Schema (from Story 3.3):**
```typescript
// health_companion.user_preferences table
export const userPreferences = healthCompanionSchema.table(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique(),
    username: text('username').unique(),
    displayName: text('display_name'),
    emailNotifications: boolean('email_notifications').default(true).notNull(),
    language: text('language').default('en').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
```

**Existing Dashboard Page Logic (lines 22-32):**
```typescript
// Redirect new users to onboarding if no preferences
if (user) {
  const existingPreferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  if (existingPreferences.length === 0) {
    redirect('/onboarding');
  }
}
```

### Latest Technical Specifics

**Next.js 15 Patterns:**
- Server Components by default: `page.tsx` is Server Component
- Use `'use client'` only for components with hooks, events, or browser APIs
- Server Components can fetch data directly (no useEffect needed)
- Use `cookies()` from `next/headers` for server-side Supabase client

**Conditional Rendering Pattern:**
```typescript
// Server Component
const DashboardIndexPage = async () => {
  const user = await getUser();
  const isNew = await isNewUser(user.id);

  // Conditionally render different components
  if (isNew) {
    return <WelcomeDashboard user={user} />;
  }

  return <RegularDashboard user={user} />;
};
```

**Drizzle ORM Patterns:**
```typescript
import { eq, count } from 'drizzle-orm';

// Count query
const threadCount = await db
  .select({ count: count() })
  .from(threads)
  .where(eq(threads.userId, userId));

// Check if zero
const isNew = threadCount[0]?.count === 0;
```

**Client Component Navigation:**
```typescript
'use client'

import { useRouter } from 'next/navigation'

export function ActionCard({ href }) {
  const router = useRouter()

  const handleClick = () => {
    router.push(href)
  }

  return <Button onClick={handleClick}>...</Button>
}
```

### Project Context Reference

**Critical Rules from CLAUDE.md:**

1. **Authentication Pattern (Server Components):**
   ```typescript
   const cookieStore = await cookies();
   const supabase = createClient(cookieStore);
   const { data: { user } } = await supabase.auth.getUser();
   ```

2. **Protected Routes:**
   - Dashboard already protected by middleware
   - No additional auth needed in page.tsx

3. **Database Access:**
   - Use `db` from `@/libs/DB`
   - Import schemas from `@/models/Schema`
   - Use `health_companion.user_preferences` table (NOT public.user_profiles)

4. **i18n Pattern:**
   ```typescript
   const t = useTranslations('Dashboard');
   <h2>{t('welcomeTitle', { name: displayName })}</h2>
   ```

5. **Routing Structure:**
   - Dashboard: `src/app/[locale]/(auth)/dashboard/`
   - Chat: `src/app/[locale]/(chat)/chat/`
   - Profile: `src/app/[locale]/(auth)/dashboard/user-profile/`

6. **Absolute Imports:**
   ```typescript
   // ✅ CORRECT
   import { Button } from '@/components/ui/button'
   import { WelcomeDashboard } from '@/components/dashboard/WelcomeDashboard'
   ```

### Story Completion Status

**Ultimate Context Engine Analysis Completed**

This story file contains comprehensive developer guidance derived from:
- ✅ Epic 3 requirements and acceptance criteria
- ✅ Story 3.1-3.3 implementation patterns and learnings
- ✅ Existing dashboard page analysis (`dashboard/page.tsx`)
- ✅ Database schema analysis (`userPreferences`, `threads` tables)
- ✅ UX design references (MagicPatterns URL for Dashboard Welcome State)
- ✅ Component strategy document guidance
- ✅ Git commit history for recent patterns
- ✅ Project context (CLAUDE.md, routing structure, auth patterns)
- ✅ Next.js 15 Server Component patterns
- ✅ Drizzle ORM query patterns
- ✅ i18n translation patterns

The developer now has everything needed for flawless implementation without guesswork or ambiguity.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - story prepared with comprehensive context.

### Completion Notes List

Story 3.5 is the dashboard welcome state for new users. This story creates a warm, guided first experience on the dashboard by:
1. Showing a personalized welcome message
2. Displaying 2-3 "Getting Started" action cards
3. Guiding users to key features (chat, profile, explore)
4. Transitioning to regular dashboard when user has activity

Key implementation notes:
- Extract UI components from MagicPatterns (WelcomeDashboard, ActionCard)
- Add welcome state detection logic (check for chat threads)
- Conditionally render welcome vs regular dashboard in page.tsx
- Use existing database tables (userPreferences, threads)
- All patterns from Stories 3.1-3.3 are directly applicable
- Server Component for page.tsx, Client Component for WelcomeDashboard

### File List

**To be Created:**
- `src/components/dashboard/WelcomeDashboard.tsx`
- `src/components/dashboard/ActionCard.tsx`
- `src/components/dashboard/__tests__/WelcomeDashboard.test.tsx`
- `src/components/dashboard/__tests__/ActionCard.test.tsx`
- `src/lib/dashboard-utils.ts`
- `src/lib/__tests__/dashboard-utils.test.ts`

**To be Modified:**
- `src/app/[locale]/(auth)/dashboard/page.tsx` (add welcome state logic)
- `src/locales/en.json` (add Dashboard translations)
- `src/locales/hi.json` (add Dashboard translations)
- `src/locales/bn.json` (add Dashboard translations)

**No Database Changes Required:**
- Uses existing `health_companion.user_preferences` table
- Uses existing `health_companion.threads` table

---

## Desk Check

**Status:** changes_requested
**Date:** 2026-01-27 01:39
**Full Report:** [View Report](../../screenshots/story-3.5/desk-check-report.md)

### Issues to Address
1. [MAJOR] Welcome state UI cannot be verified - test user has existing chat threads
   - Regular dashboard displays correctly (AC4), but AC1-AC3 unverified
   - Solution: Create fresh test user or clear existing chat threads
   - Code review shows implementation is architecturally sound
2. [MAJOR] Need visual verification of welcome state components
   - Action cards, hover effects, responsive behavior, mobile touch targets
   - Requires re-run with welcome state visible

**Action Required:** Clean .next directory and rebuild before visual inspection can proceed.
