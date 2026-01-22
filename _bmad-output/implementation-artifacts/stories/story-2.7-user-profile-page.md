# Story 2.7: User Profile Page

**Epic**: Epic 2 - Complete Authentication Experience
**Status**: In Progress
**Created**: 2026-01-22

## User Story

As a signed-in user, I want to view and edit my profile information so that I can personalize my account.

## Acceptance Criteria

1. View profile page showing current information
2. Email address displayed (read-only, not editable)
3. Username field with real-time availability check (debounced API call)
4. Display name field (editable)
5. Username validation: alphanumeric, 3-20 characters
6. Save button with loading state
7. Success toast notification on save
8. Account deletion option with confirmation dialog (warn about permanent data loss)

## Technical Requirements

- Next.js 15 App Router with Supabase auth
- i18n via next-intl (locales: en, hi, bn)
- Profile page route: `/[locale]/(auth)/dashboard/user-profile/page.tsx`
- Use existing toast hook: `@/hooks/use-toast`
- Store username/display_name in Supabase user_metadata
- Follow MagicPatterns styling (consistent with sign-in/sign-up pages)
- Create API routes:
  - `/api/profile/check-username` - username availability
  - `/api/profile/update` - update profile
  - `/api/profile/delete` - delete account
- All strings must be translatable

## Implementation Tasks

### Task 1: Create Story File
- [x] Create story markdown file

### Task 2: User Profile Page Component
- [ ] Create `/src/app/[locale]/(auth)/dashboard/user-profile/page.tsx`
- [ ] Display email (read-only)
- [ ] Username field with validation
- [ ] Display name field
- [ ] Save button with loading state
- [ ] Account deletion button

### Task 3: API Routes
- [ ] `/api/profile/check-username` - Check username availability
- [ ] `/api/profile/update` - Update user profile
- [ ] `/api/profile/delete` - Delete user account

### Task 4: Translations
- [ ] Add all profile-related strings to en.json
- [ ] Add Hindi translations to hi.json
- [ ] Add Bengali translations to bn.json

### Task 5: Testing
- [ ] Write unit tests for profile page
- [ ] Run all tests and ensure they pass

### Task 6: Documentation
- [ ] Update sprint-status.yaml
- [ ] Commit changes

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Profile page functional and styled
- [ ] Username availability check works with debouncing
- [ ] Account deletion flow works with confirmation
- [ ] All tests passing
- [ ] Translations added for all three locales
- [ ] Code committed with conventional commit message
