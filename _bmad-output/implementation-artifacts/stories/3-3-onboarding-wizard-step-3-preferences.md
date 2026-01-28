# Story 3.3: Onboarding Wizard - Step 3 (Preferences)

Status: ready-for-dev

## Story

As a **new user completing onboarding**,
I want **to set my basic preferences**,
So that **the app is configured to my liking from the start**.

## Acceptance Criteria

**AC1: Preference Options Display**
- **Given** I completed Step 2 (feature tour)
- **When** I advance to Step 3
- **Then** I see preference options for notifications and language
- **And** sensible defaults are pre-selected

**AC2: Notification Preference Toggle**
- **Given** I am on Step 3
- **When** I view notification preferences
- **Then** I see options for email notifications (on/off)
- **And** I can toggle preferences easily
- **And** my choices are clearly indicated

**AC3: Language Preference Selection**
- **Given** I am on Step 3
- **When** I view language preference
- **Then** I see a dropdown with available languages (English, Hindi, Bengali)
- **And** current browser/system language is pre-selected
- **And** I can change my preference

**AC4: Complete Setup and Save**
- **Given** I have set my preferences
- **When** I click "Complete Setup"
- **Then** my preferences are saved
- **And** I see a success message "You're all set!"
- **And** I am redirected to the dashboard

**AC5: Dashboard Language Application**
- **Given** I complete onboarding
- **When** I land on the dashboard
- **Then** my selected language is active
- **And** notification preferences are saved to my profile

## Tasks / Subtasks

### Task 1: Update Database Schema for Preferences (AC2, AC3, AC5)
- [ ] Add preference fields to `user_profiles` table
  - [ ] `email_notifications` (boolean, default true)
  - [ ] `language` (text, nullable)
- [ ] Generate migration: `npm run db:generate`
- [ ] Test migration applies cleanly
- [ ] Verify types updated in `Schema.ts`

### Task 2: Install Required shadcn Components (AC2, AC3)
- [ ] Install Switch component: `npx shadcn@latest add switch`
- [ ] Install Select component: `npx shadcn@latest add select`
- [ ] Verify components work with project Tailwind config
- [ ] Test dark mode support for both components

### Task 3: Extract & Adapt OnboardingPreferences Component (AC1, AC2, AC3, AC4)
- [ ] **EXTRACT** from MagicPatterns:
  ```
  mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1urfca8jgldest2yvquw6l", fileNames: ["OnboardingPreferences.tsx"])
  ```
- [ ] **ADAPT** extracted code for project:
  - [ ] Add `"use client"` directive at top
  - [ ] Replace hardcoded text with `useTranslations('Onboarding')` calls
  - [ ] Import `ProgressIndicator` from `./ProgressIndicator`
  - [ ] Use project's `Button` from `@/components/ui/button`
  - [ ] Use project's `Switch` from `@/components/ui/switch`
  - [ ] Use project's `Select` from `@/components/ui/select`
  - [ ] Wire up to Supabase profile update API
  - [ ] Integrate React Hook Form + Zod validation
- [ ] **VERIFY** structure matches project patterns:
  - [ ] Progress indicator showing step 3 of 3
  - [ ] Header with title and description
  - [ ] Notification toggle with label and description
  - [ ] Language dropdown with 3 options
  - [ ] Complete Setup button with success state
  - [ ] Skip link with ghost variant
- [ ] **ALIGN** styling with previous onboarding steps:
  - [ ] Same outer gradient background
  - [ ] Same card container styling
  - [ ] Same button hover effects
  - [ ] Dark mode support via Tailwind `dark:` variants

### Task 4: Create Preferences API Route (AC4, AC5)
- [ ] Create `/api/profile/update-preferences` route
  - [ ] Validate session (Supabase auth check)
  - [ ] Accept `{ emailNotifications: boolean, language: string }` body
  - [ ] Validate with Zod schema:
    - `emailNotifications`: boolean
    - `language`: enum of 'en', 'hi', 'bn'
  - [ ] Update `user_profiles` table
  - [ ] Update `onboarding_completed_at` timestamp
  - [ ] Update `onboarding_step` to 3
  - [ ] Return success response
- [ ] Add error handling for database failures
- [ ] Add proper TypeScript types for request/response

### Task 5: Implement Form State Management (AC2, AC3, AC4)
- [ ] Use React Hook Form with Zod schema:
  ```typescript
  const preferencesSchema = z.object({
    emailNotifications: z.boolean(),
    language: z.enum(['en', 'hi', 'bn'])
  })
  ```
- [ ] Set default values:
  - [ ] `emailNotifications`: true (opt-in by default)
  - [ ] `language`: detect from next-intl current locale
- [ ] Wire Switch component to form state
- [ ] Wire Select component to form state
- [ ] Handle form submission:
  - [ ] Show loading state on button
  - [ ] Call `/api/profile/update-preferences`
  - [ ] Show success toast
  - [ ] Redirect to dashboard on success
  - [ ] Show error toast on failure

### Task 6: Update Onboarding Page Step Routing (AC1, AC4)
- [ ] Modify `app/[locale]/(auth)/onboarding/page.tsx`
  - [ ] Add case 3 to switch statement
  - [ ] Render `OnboardingPreferences` component
  - [ ] Verify step 3 only accessible if step 2 completed
  - [ ] Handle edge case: user tries to skip to step 3 directly

### Task 7: Implement Dashboard Redirect Logic (AC4, AC5)
- [ ] On successful preferences save:
  - [ ] Use `window.location.href = '/dashboard'` (hard navigation)
  - [ ] Ensures server re-renders with new language preference
  - [ ] Similar pattern to Step 1 username save
- [ ] Verify middleware redirects completed onboarding to dashboard
- [ ] Test language change takes effect immediately on dashboard

### Task 8: Add i18n Translations (AC1, AC2, AC3, AC4)
- [ ] Add to `src/locales/en.json`:
  ```json
  "step3Title": "Set Your Preferences",
  "step3Description": "Customize your experience to suit your needs",
  "notificationsLabel": "Email Notifications",
  "notificationsDescription": "Receive updates and important alerts",
  "languageLabel": "Language",
  "languageDescription": "Choose your preferred language",
  "languageEn": "English",
  "languageHi": "Hindi",
  "languageBn": "Bengali",
  "completeSetup": "Complete Setup",
  "successMessage": "You're all set! Redirecting to dashboard..."
  ```
- [ ] Add same keys to `hi.json` with Hindi translations
- [ ] Add same keys to `bn.json` with Bengali translations

### Task 9: Handle Language Change Application (AC5)
- [ ] After saving preferences, language change applied via:
  - [ ] Hard redirect to `/dashboard` forces server to re-render
  - [ ] Middleware reads user's language preference from profile
  - [ ] next-intl applies correct locale automatically
- [ ] Alternative approach (if middleware doesn't auto-apply):
  - [ ] Redirect to `/{language}/dashboard` explicitly
  - [ ] Requires reading saved language from API response

### Task 10: Write Unit Tests
- [ ] Test `OnboardingPreferences` component:
  - [ ] Renders progress indicator (step 3 of 3)
  - [ ] Renders notification toggle
  - [ ] Renders language dropdown with 3 options
  - [ ] Default values set correctly
  - [ ] Form submission calls API
  - [ ] Success shows toast and redirects
  - [ ] Error shows toast
- [ ] Test API route `/api/profile/update-preferences`:
  - [ ] Unauthorized requests rejected (401)
  - [ ] Valid data saves to database
  - [ ] Invalid language rejected (400)
  - [ ] onboarding_completed_at timestamp set
- [ ] Test form validation:
  - [ ] emailNotifications accepts boolean
  - [ ] language accepts only en/hi/bn
  - [ ] Invalid values rejected

### Task 11: Write Integration Tests
- [ ] E2E test for complete onboarding flow:
  - [ ] Complete Step 1 (username)
  - [ ] Complete Step 2 (feature tour)
  - [ ] Arrive at Step 3
  - [ ] Toggle email notifications
  - [ ] Select language (Hindi)
  - [ ] Click Complete Setup
  - [ ] Verify redirect to dashboard
  - [ ] Verify dashboard displays in Hindi
  - [ ] Verify preferences saved in database

## Dev Notes

### Architecture Compliance

**Component Organization (Following Story 3.1 and 3.2 Patterns):**
- Component location: `src/components/onboarding/OnboardingPreferences.tsx`
- Reuse existing: `ProgressIndicator.tsx` (already created)
- Follow same visual structure as `OnboardingUsername.tsx` and `OnboardingFeatureTour.tsx`

**Database Changes:**
- Add `email_notifications` (boolean, default true) to `user_profiles` table
- Add `language` (text, nullable) to `user_profiles` table
- Update `onboarding_completed_at` when preferences saved
- Update `onboarding_step` to 3 when preferences saved

**API Pattern:**
```typescript
// Route: /api/profile/update-preferences
// Method: PATCH
// Body: { emailNotifications: boolean, language: 'en' | 'hi' | 'bn' }
// Response: { success: boolean, data?: { emailNotifications, language }, error?: string }
```

**Form Handling Pattern:**
```typescript
const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  language: z.enum(['en', 'hi', 'bn'])
});

// Default values from current locale
const { locale } = useParams();
const defaultValues = {
  emailNotifications: true,
  language: locale as 'en' | 'hi' | 'bn'
};
```

### UX Design References

**CRITICAL: DO NOT BUILD FROM SCRATCH**

The UI components for this story are already implemented in MagicPatterns.

| Screen/Component | Design Tool | URL | Files to Extract |
|------------------|-------------|-----|------------------|
| Onboarding Step 3 (Preferences) | MagicPatterns | [View](https://www.magicpatterns.com/c/1urfca8jgldest2yvquw6l) | `OnboardingPreferences.tsx` |

**Extraction Command:**
```
mcp__magic-patterns__read_files(url: "https://www.magicpatterns.com/c/1urfca8jgldest2yvquw6l", fileNames: ["OnboardingPreferences.tsx"])
```

**Adaptation Checklist:**
- [ ] Replace inline styles with project's Tailwind classes if different
- [ ] Swap any custom toggle for shadcn `Switch` component
- [ ] Swap any custom dropdown for shadcn `Select` component
- [ ] Add `"use client"` directive for Next.js
- [ ] Wire up to `/api/profile/update-preferences` endpoint
- [ ] Add proper TypeScript types for form data
- [ ] Integrate with React Hook Form + Zod validation
- [ ] Add i18n translations using `useTranslations`
- [ ] Use project's toast notifications for success/error feedback
- [ ] Ensure responsive design matches project patterns
- [ ] Match styling of Step 1 and Step 2 components exactly

**Reference Documents:**
- Design Brief: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-design-brief.md](../../planning-artifacts/ux-design/epic-3-onboarding-design-brief.md)
- Component Strategy: [_bmad-output/planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md](../../planning-artifacts/ux-design/epic-3-onboarding-component-strategy.md)

### Library & Framework Requirements

**shadcn Components to Install:**
```bash
npx shadcn@latest add switch select
```

**Already Installed (from Epic 2 and Story 3.1):**
- button, input, label, form, toast, card, checkbox, avatar, alert, progress

**Form Libraries (Already Installed):**
- React Hook Form
- Zod
- @hookform/resolvers

**Icons (lucide-react):**
```typescript
import { ArrowRight, Bell, Globe, Check } from 'lucide-react'
```

### File Structure Requirements

```
src/
├── app/[locale]/(auth)/onboarding/
│   └── page.tsx                          # MODIFY: Add step 3 case
├── components/onboarding/
│   ├── OnboardingUsername.tsx            # EXISTING (no changes)
│   ├── OnboardingFeatureTour.tsx         # EXISTING (no changes)
│   ├── OnboardingPreferences.tsx         # CREATE: Step 3 component
│   ├── ProgressIndicator.tsx             # EXISTING (no changes)
│   ├── UsernameInput.tsx                 # EXISTING (no changes)
│   └── __tests__/
│       ├── OnboardingUsername.test.tsx   # EXISTING
│       ├── OnboardingFeatureTour.test.tsx # EXISTING
│       └── OnboardingPreferences.test.tsx # CREATE
├── app/api/profile/
│   ├── check-username/                   # EXISTING
│   ├── update-username/                  # EXISTING
│   └── update-preferences/
│       └── route.ts                      # CREATE: Preferences API
└── models/
    └── Schema.ts                         # MODIFY: Add preference fields
```

### Testing Requirements

**Unit Tests (Vitest):**
- Component renders all preference controls
- Progress indicator shows step 3 of 3
- Default values set correctly
- Form submission behavior
- Success/error handling

**API Route Tests:**
- Authentication required
- Valid data saves correctly
- Invalid data rejected
- Onboarding completion marked

**Integration Tests (Playwright):**
- Complete full 3-step onboarding flow
- Verify preferences save
- Verify dashboard language changes
- Test notification preference persistence

**Test File Location:**
- `src/components/onboarding/__tests__/OnboardingPreferences.test.tsx`
- `src/app/api/profile/update-preferences/route.test.ts`

### Previous Story Intelligence

**Story 3.1 and 3.2 Learnings - CRITICAL PATTERNS TO FOLLOW:**

1. **Component Structure Pattern (from Story 3.1 and 3.2):**
   ```typescript
   'use client'

   import { ArrowRight } from 'lucide-react'
   import { useRouter } from 'next/navigation'
   import { useTranslations } from 'next-intl'
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'

   import { Button } from '@/components/ui/button'
   import { Switch } from '@/components/ui/switch'
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
   import { ProgressIndicator } from './ProgressIndicator'

   export function OnboardingPreferences() {
     const t = useTranslations('Onboarding')
     const [isSubmitting, setIsSubmitting] = useState(false)
     const { toast } = useToast()

     // Form with React Hook Form + Zod
     const form = useForm({
       resolver: zodResolver(preferencesSchema),
       defaultValues: { ... }
     })

     const onSubmit = async (data) => {
       // API call with error handling
       // Success: toast + redirect
     }

     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 dark:from-slate-950 dark:to-slate-900">
         {/* Content */}
       </div>
     )
   }
   ```

2. **Card Container Pattern (match exactly from Story 3.1):**
   ```jsx
   <div className="w-full max-w-md rounded-2xl border border-slate-100/50 bg-white p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900 md:p-10">
   ```

3. **Button Pattern (from Story 3.1):**
   ```jsx
   <Button
     className="w-full gap-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
     onClick={handleSubmit(onSubmit)}
     disabled={isSubmitting}
   >
     <span>{t('completeSetup')}</span>
     <ArrowRight className="size-4" />
   </Button>
   ```

4. **Skip Link Pattern (from Story 3.1 and 3.2):**
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

5. **Hard Navigation Pattern (from Story 3.1):**
   ```javascript
   // Use hard navigation for server-side language application
   window.location.href = '/dashboard';
   ```

6. **Files Created in Story 3.1:**
   - `src/components/onboarding/OnboardingUsername.tsx` - REFERENCE for structure
   - `src/components/onboarding/ProgressIndicator.tsx` - REUSE directly
   - `src/components/onboarding/UsernameInput.tsx` - Not needed for Step 3

7. **Files Created in Story 3.2:**
   - `src/components/onboarding/OnboardingFeatureTour.tsx` - REFERENCE for step routing pattern
   - Step routing added to `onboarding/page.tsx` - EXTEND with case 3

### Git Intelligence Summary

**Recent Commits:**
- `adb0d67`: feat(onboarding): implement feature tour wizard step (Story 3.2)
- `586856e`: fix: updated claude-workflows with more sophisticated gitignore system
- `275570e`: feat: story 3.1 implemented
- `4f77988`: feat(onboarding): implement username selection wizard (Story 3.1)

**Story 3.2 Implementation Details (adb0d67):**
- Added `OnboardingFeatureTour.tsx` component with 4 feature cards
- Updated `onboarding/page.tsx` with step routing (switch statement)
- Fixed form submission bug in `OnboardingUsername.tsx` (use `setValue` instead of `register`)
- Added i18n translations for step 2 in en/hi/bn
- Added comprehensive unit tests (8 tests)
- Tests: 198/198 passing
- Agent used: onboarding-wizard-specialist

**Key Patterns from Recent Work:**
- All onboarding components follow same visual structure
- Step routing in page.tsx uses switch statement with query param `?step=N`
- Hard navigation (`window.location.href`) used for server-side updates
- React Hook Form + Zod for all forms
- Comprehensive i18n for all UI text
- Unit tests co-located with components
- Dark mode support mandatory

### Latest Technical Specifics

**Next.js 15 Patterns:**
- Async params: `const params = await params` (breaking change from 14)
- Server Components by default: only add `'use client'` when needed
- Use `next/navigation` for programmatic navigation: `import { useRouter } from 'next/navigation'`
- Hard navigation with `window.location.href` for query param routes that need server refresh

**Supabase Auth Patterns:**
- Server: `createClient(await cookies())` for Server Components and API routes
- Client: `createBrowserClient()` for Client Components
- Session validation: Always check `user` is defined and `error` is null

**Drizzle ORM Patterns:**
- Schema changes require migration: `npm run db:generate`
- TypeScript types auto-update from schema
- Use `eq()` for equality checks: `where(eq(userProfiles.userId, user.id))`

**React Hook Form + shadcn Integration:**
- Use `setValue` instead of `register` for controlled components (Switch, Select)
- shadcn components work with React Hook Form via controlled pattern
- Example:
  ```typescript
  <Switch
    checked={form.watch('emailNotifications')}
    onCheckedChange={(checked) => form.setValue('emailNotifications', checked)}
  />
  ```

**next-intl Language Switching:**
- Current locale available via `useLocale()` hook or `params.locale`
- Hard redirect to dashboard forces re-render with new language
- Middleware automatically applies language from user profile (if implemented)
- If not automatic, redirect to `/${language}/dashboard`

### Project Context Reference

**Critical Rules from project-context.md:**

1. **NEVER Skip API Route Authentication:**
   ```typescript
   const cookieStore = await cookies();
   const supabase = createClient(cookieStore);
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) {
     return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
   }
   ```

2. **NEVER Skip Input Validation:**
   ```typescript
   const schema = z.object({
     emailNotifications: z.boolean(),
     language: z.enum(['en', 'hi', 'bn'])
   });
   const validated = schema.parse(body);
   ```

3. **NEVER Hardcode User-Facing Text:**
   ```typescript
   const t = useTranslations('Onboarding');
   <Button>{t('completeSetup')}</Button>
   ```

4. **NEVER Use Relative Imports for src/ Files:**
   ```typescript
   // ✅ CORRECT
   import { Button } from '@/components/ui/button'
   import { ProgressIndicator } from './ProgressIndicator'  // Same folder OK
   ```

5. **NEVER Add 'use client' Without Reason:**
   - Step 3 component NEEDS `'use client'` because:
     - Uses `useForm` hook
     - Uses `useTranslations` hook
     - Has onClick event handlers
     - Uses controlled components (Switch, Select)

6. **Database Rules:**
   - Schema changes REQUIRE `npm run db:generate`
   - Database columns use `snake_case`
   - TypeScript uses `camelCase` (Drizzle auto-converts)

### Story Completion Status

**Ultimate Context Engine Analysis Completed**

This story file contains comprehensive developer guidance derived from:
- ✅ Epic 3 requirements and acceptance criteria
- ✅ Story 3.1 and 3.2 implementation patterns and learnings
- ✅ Existing component code analysis (`OnboardingUsername.tsx`, `OnboardingFeatureTour.tsx`, `ProgressIndicator.tsx`)
- ✅ Page routing structure analysis (`onboarding/page.tsx`)
- ✅ i18n translation patterns from locales files
- ✅ UX design references (MagicPatterns URL for Step 3)
- ✅ Component strategy document guidance
- ✅ Git commit history for recent patterns
- ✅ Project context (critical rules, TypeScript patterns, Next.js 15 specifics)
- ✅ Database schema patterns from Story 3.1
- ✅ API route patterns from Story 3.1
- ✅ Form handling patterns from Story 3.1
- ✅ shadcn component integration patterns

The developer now has everything needed for flawless implementation without guesswork or ambiguity.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - story prepared with comprehensive context.

### Completion Notes List

Story 3.3 is the final step in the 3-step onboarding wizard. This story completes the onboarding flow by:
1. Allowing users to set notification preferences
2. Allowing users to select their preferred language
3. Marking onboarding as complete
4. Redirecting to dashboard with applied preferences

Key implementation notes:
- Database schema requires 2 new fields: `email_notifications` and `language`
- API route similar to `/api/profile/update-username` from Story 3.1
- Component structure identical to Story 3.1 and 3.2
- Hard navigation required for language change to take effect
- All patterns established in previous stories are directly applicable

### File List

**To be Created:**
- `src/components/onboarding/OnboardingPreferences.tsx`
- `src/components/onboarding/__tests__/OnboardingPreferences.test.tsx`
- `src/app/api/profile/update-preferences/route.ts`
- `src/app/api/profile/update-preferences/route.test.ts`
- `migrations/XXXX_add_user_preferences.sql` (auto-generated)
- `src/components/ui/switch.tsx` (shadcn install)
- `src/components/ui/select.tsx` (shadcn install)

**To be Modified:**
- `src/models/Schema.ts` (add preference fields)
- `src/app/[locale]/(auth)/onboarding/page.tsx` (add step 3 case)
- `src/locales/en.json` (add step 3 translations)
- `src/locales/hi.json` (add step 3 translations)
- `src/locales/bn.json` (add step 3 translations)

---

## Desk Check

**Status:** approved
**Date:** 2026-01-27 00:42
**Full Report:** [View Report](../../screenshots/story-3.3/desk-check-report.md)

Visual quality validated. Ready for code review.
