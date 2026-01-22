# Epic 3: User Onboarding & Welcome

**Goal:** New users feel guided and welcomed, not dumped on empty dashboard

**UX Design Artifacts:**
- [Design Brief](../ux-design/epic-3-onboarding-design-brief.md)
- [Component Strategy](../ux-design/epic-3-onboarding-component-strategy.md)
- [User Journeys](../ux-design/epic-3-onboarding-user-journeys.md)

## Story 3.1: Onboarding Wizard - Step 1 (Username)

As a **new user who just verified my email**,
I want **to set my username as the first step of onboarding**,
So that **I have a unique identity in the application**.

**Acceptance Criteria:**

**Given** I have just verified my email
**When** I am redirected to the app
**Then** I land on the onboarding wizard at Step 1
**And** I see a friendly welcome message
**And** I see a username input field

**Given** I am on Step 1 of onboarding
**When** I enter a username
**Then** I see real-time availability checking
**And** available usernames show success indicator
**And** taken usernames show "Username taken" error

**Given** I enter a valid, available username
**When** I click "Continue"
**Then** my username is saved to my profile
**And** I advance to Step 2
**And** progress indicator updates

**Given** I enter an invalid username format
**When** I view the validation feedback
**Then** I see the format requirements (3-20 chars, alphanumeric, underscores)
**And** I cannot proceed until valid

**Given** the onboarding wizard
**When** I view Step 1
**Then** I see a progress indicator showing 1 of 3
**And** the UI is clean and focused on the single task

**UX Design:**
- **Prototype:** [Onboarding Step 1](https://www.magicpatterns.com/c/8dywtcpmne2a3vzohcewiu)
- **Components:** `UsernameInput.tsx`, `ProgressIndicator.tsx`, `OnboardingUsername.tsx`

---

## Story 3.2: Onboarding Wizard - Step 2 (Feature Tour)

As a **new user completing onboarding**,
I want **to see a brief overview of the app's key features**,
So that **I understand what I can do with the application**.

**Acceptance Criteria:**

**Given** I completed Step 1 (username)
**When** I advance to Step 2
**Then** I see a feature tour with 3-4 key features highlighted
**And** each feature has an icon, title, and brief description
**And** visuals are clean and professional

**Given** I am on Step 2
**When** I view the feature cards
**Then** features are presented in logical order
**And** descriptions are concise (1-2 sentences each)
**And** icons are meaningful and consistent

**Given** I am on Step 2
**When** I click "Continue"
**Then** I advance to Step 3
**And** progress indicator shows 2 of 3 complete

**Given** the feature tour
**When** I view it on mobile
**Then** features stack vertically
**And** layout is optimized for smaller screens
**And** all content is readable without horizontal scrolling

**UX Design:**
- **Prototype:** [Onboarding Step 2](https://www.magicpatterns.com/c/5imgbchlrja7tknmvtvken)
- **Components:** `OnboardingFeatureTour.tsx`, `FeatureCard` (custom)

---

## Story 3.3: Onboarding Wizard - Step 3 (Preferences)

As a **new user completing onboarding**,
I want **to set my basic preferences**,
So that **the app is configured to my liking from the start**.

**Acceptance Criteria:**

**Given** I completed Step 2 (feature tour)
**When** I advance to Step 3
**Then** I see preference options for notifications and language
**And** sensible defaults are pre-selected

**Given** I am on Step 3
**When** I view notification preferences
**Then** I see options for email notifications (on/off)
**And** I can toggle preferences easily
**And** my choices are clearly indicated

**Given** I am on Step 3
**When** I view language preference
**Then** I see a dropdown with available languages (English, Hindi, Bengali)
**And** current browser/system language is pre-selected
**And** I can change my preference

**Given** I have set my preferences
**When** I click "Complete Setup"
**Then** my preferences are saved
**And** I see a success message "You're all set!"
**And** I am redirected to the dashboard

**Given** I complete onboarding
**When** I land on the dashboard
**Then** my selected language is active
**And** notification preferences are saved to my profile

**UX Design:**
- **Prototype:** [Onboarding Step 3](https://www.magicpatterns.com/c/1urfca8jgldest2yvquw6l)
- **Components:** `OnboardingPreferences.tsx`, shadcn `Switch`, shadcn `Select`

---

## Story 3.4: Onboarding Progress & Skip

As a **new user going through onboarding**,
I want **to see my progress and skip if I choose**,
So that **I feel in control of my experience**.

**Acceptance Criteria:**

**Given** I am in the onboarding wizard
**When** I view any step
**Then** I see a progress indicator (e.g., "Step 1 of 3")
**And** completed steps are visually marked
**And** current step is highlighted

**Given** I am on any onboarding step
**When** I look for a skip option
**Then** I see "Skip for now" link
**And** it is visible but not prominent (encouraging completion)

**Given** I click "Skip for now"
**When** I confirm I want to skip
**Then** I am taken to the dashboard
**And** onboarding is marked as incomplete
**And** I see a prompt to complete setup later

**Given** I skipped onboarding
**When** I return to the app later
**Then** I see a subtle reminder to complete setup
**And** I can access onboarding from my profile/settings
**And** my previous progress is preserved

**Given** I completed some steps then skipped
**When** I return to complete onboarding
**Then** I resume from where I left off
**And** completed steps are not repeated
**And** I can complete the remaining steps

**UX Design:**
- **Prototype:** Progress indicator present in all 3 step designs
- **Components:** `ProgressIndicator.tsx` (extract from Step 1 design)
- **Flow:** See [User Journeys](../ux-design/epic-3-onboarding-user-journeys.md) for skip/resume logic

---

## Story 3.5: Dashboard Welcome State

As a **new user landing on the dashboard for the first time**,
I want **to see a welcoming experience with guidance**,
So that **I know what to do next and feel oriented**.

**Acceptance Criteria:**

**Given** I am a new user with no activity
**When** I land on the dashboard
**Then** I see a personalized welcome message with my name/username
**And** I see a "Getting Started" section with suggested actions
**And** the page feels welcoming, not empty

**Given** the dashboard welcome state
**When** I view suggested actions
**Then** I see 2-3 clear next steps
**And** each action has a title, description, and CTA button
**And** actions are relevant to getting started

**Given** I complete a suggested action
**When** I return to the dashboard
**Then** the completed action is marked or removed
**And** new suggestions may appear based on progress

**Given** I have used the app for a while
**When** I have meaningful activity/data
**Then** welcome state transitions to regular dashboard
**And** data and activity are prominently displayed
**And** getting started section is minimized or hidden

**Given** the welcome state
**When** I view it on mobile
**Then** layout is optimized for mobile
**And** CTAs are touch-friendly
**And** content is scannable

**UX Design:**
- **Prototype:** [Dashboard Welcome State](https://www.magicpatterns.com/c/n5z2nuwsc58wh1grcqascq)
- **Components:** `WelcomeDashboard.tsx`, `ActionCard.tsx`, `Sidebar.tsx`, `DashboardLayout.tsx`

---

## Story 3.6: Empty States Design System

As a **user viewing a section with no data**,
I want **to see helpful empty states instead of blank pages**,
So that **I understand what to do and don't feel confused**.

**Acceptance Criteria:**

**Given** any list or data view with no items
**When** the view loads
**Then** I see an empty state component
**And** it includes an illustration or icon
**And** it includes a heading explaining the empty state
**And** it includes a CTA to take action

**Given** empty state components
**When** I review the component library
**Then** there is a reusable EmptyState component
**And** it accepts props for: icon, title, description, action
**And** it follows the design system styling

**Given** an empty state with a CTA
**When** I click the action button
**Then** I am taken to the relevant creation flow
**And** the action is contextually appropriate

**Given** different empty states across the app
**When** I compare them
**Then** they have consistent styling
**And** illustrations/icons follow a cohesive style
**And** messaging tone is consistent (helpful, encouraging)

**Given** empty states
**When** I view them on mobile
**Then** they are properly sized and centered
**And** CTAs are full-width and touch-friendly
**And** text is readable

**UX Design:**
- **Prototype:** [EmptyState Component](https://www.magicpatterns.com/c/767wxut5smepk5irxbwjqa)
- **Components:** `EmptyState.tsx` (reusable, goes in `src/components/ui/`)
- **Variants:** default, search (no results), error (with retry)

---

## Story 3.7: Loading States Pattern Library

As a **user waiting for content to load**,
I want **to see appropriate loading indicators**,
So that **I know the app is working and what to expect**.

**Acceptance Criteria:**

**Given** a page or section loading async data
**When** the data is being fetched
**Then** I see skeleton loaders matching content shape
**And** skeletons animate subtly (pulse or shimmer)
**And** layout shift is minimal when content loads

**Given** the component library
**When** I review loading components
**Then** there is a Skeleton component for content placeholders
**And** there is a Spinner component for action feedback
**And** there are variants for different sizes

**Given** skeleton loaders
**When** I view them across the app
**Then** they match the shape of the content they replace
**And** cards have card-shaped skeletons
**And** text has line-shaped skeletons
**And** avatars have circle-shaped skeletons

**Given** an action button triggering async operation
**When** I click the button
**Then** I see a spinner in/on the button
**And** the button is disabled during loading
**And** spinner size is appropriate for the button

**Given** a full-page loading state
**When** initial page data is loading
**Then** I see a centered spinner or skeleton layout
**And** there is no flash of empty content
**And** transition to loaded state is smooth

**Given** loading states on slow connections
**When** loading takes more than 3 seconds
**Then** loading indicator remains visible
**And** user is not left wondering if app is frozen
**And** timeout handling shows appropriate message if needed

**UX Design:**
- **Prototype:** [Loading/Skeleton Patterns](https://www.magicpatterns.com/c/1xvtzkylt6kgbfkv8sc9rn)
- **Components:** `Skeleton.tsx`, `Spinner.tsx`, `LoadingCard.tsx` (go in `src/components/ui/`)
- **Skeleton Variants:** text, card, avatar, table row
- **Spinner Sizes:** sm (16px), md (24px), lg (48px)

---
