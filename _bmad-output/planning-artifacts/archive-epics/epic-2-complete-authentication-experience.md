# Epic 2: Complete Authentication Experience

**Goal:** Users can register, login, reset passwords, and use social auth with polished flows

## Story 2.1: User Registration with Email/Password

As a **new user**,
I want **to create an account with my email and password**,
So that **I can access the application's features**.

**Acceptance Criteria:**

**Given** I am on the sign-up page
**When** I enter a valid email and password meeting requirements
**Then** my account is created in Supabase
**And** a verification email is sent to my address
**And** I see a message to check my email

**Given** I enter an email that already exists
**When** I submit the registration form
**Then** I see a clear error message "Email already registered"
**And** I am offered a link to sign in instead

**Given** I enter a weak password
**When** I attempt to submit
**Then** I see validation requirements (min 8 chars, complexity)
**And** the form does not submit until requirements are met

**Given** the registration form
**When** I view it on any device
**Then** form fields are appropriately sized
**And** keyboard type is correct for email field
**And** password field has show/hide toggle

---

## Story 2.2: Email Verification Flow

As a **newly registered user**,
I want **to verify my email address**,
So that **I can fully access my account**.

**Acceptance Criteria:**

**Given** I just registered
**When** I land on the post-registration page
**Then** I see "Check your email for verification link"
**And** I see a "Resend verification email" button

**Given** I click "Resend verification email"
**When** the request is sent
**Then** I see a loading state on the button
**And** after success, I see "Email sent!" confirmation
**And** button shows cooldown timer (60 seconds) before resend

**Given** I click the verification link in my email
**When** the link is valid
**Then** I am redirected to the app with verified status
**And** I see a success message "Email verified!"
**And** I can now access all features

**Given** I click an expired verification link
**When** the token is no longer valid
**Then** I see "This link has expired"
**And** I am offered option to resend verification email

**Given** I try to access protected routes unverified
**When** my email is not yet verified
**Then** I am shown the verification required screen
**And** I cannot proceed until verified

---

## Story 2.3: User Login with Session Management

As a **registered user**,
I want **to sign in to my account**,
So that **I can access my dashboard and data**.

**Acceptance Criteria:**

**Given** I am on the sign-in page
**When** I enter valid email and password
**Then** I am authenticated successfully
**And** session is stored in HTTP-only cookies
**And** I am redirected to the dashboard

**Given** I check "Remember me" option
**When** I sign in successfully
**Then** my session persists for extended duration
**And** I remain signed in across browser restarts

**Given** I enter invalid credentials
**When** I submit the sign-in form
**Then** I see "Invalid email or password"
**And** no indication of which field is wrong (security)
**And** I can retry immediately

**Given** I am signed in and idle
**When** my session approaches expiry
**Then** the session is automatically refreshed
**And** I am not unexpectedly logged out

**Given** I am signed in
**When** I try to access sign-in page
**Then** I am redirected to dashboard
**And** I don't see the sign-in form

**Given** I am not signed in
**When** I try to access a protected route
**Then** I am redirected to sign-in page
**And** after sign-in, I am returned to my intended destination

---

## Story 2.4: Forgot Password Flow

As a **user who forgot my password**,
I want **to request a password reset**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the sign-in page
**When** I look for password recovery
**Then** I see a "Forgot password?" link clearly visible

**Given** I click "Forgot password?"
**When** the forgot password page loads
**Then** I see an email input field
**And** clear instructions to enter my email

**Given** I enter my registered email
**When** I submit the forgot password form
**Then** I see "Check your email for reset link"
**And** a password reset email is sent
**And** the email contains a secure reset link

**Given** I enter an unregistered email
**When** I submit the forgot password form
**Then** I see the same "Check your email" message (security)
**And** no indication whether email exists in system

**Given** I submit multiple reset requests
**When** I exceed rate limits
**Then** I see "Too many requests. Please try again later."
**And** I am temporarily blocked from requesting

---

## Story 2.5: Reset Password Page

As a **user with a password reset link**,
I want **to set a new password**,
So that **I can access my account with new credentials**.

**Acceptance Criteria:**

**Given** I click the reset link from my email
**When** the token is valid
**Then** I see a reset password form
**And** I can enter a new password

**Given** I am on the reset password form
**When** I enter a new password meeting requirements
**Then** my password is updated successfully
**And** I see "Password reset successful!"
**And** I am redirected to sign-in page

**Given** I enter a password not meeting requirements
**When** I try to submit
**Then** I see validation errors inline
**And** requirements are clearly displayed
**And** form does not submit until valid

**Given** I click an expired reset link
**When** the token is no longer valid
**Then** I see "This reset link has expired"
**And** I am offered a link to request a new reset

**Given** I click a malformed or invalid reset link
**When** the token cannot be verified
**Then** I see "Invalid reset link"
**And** I am offered a link to request a new reset

---

## Story 2.6: Social Authentication (Google & GitHub)

As a **user who prefers social login**,
I want **to sign in with Google or GitHub**,
So that **I don't need to remember another password**.

**Acceptance Criteria:**

**Given** I am on the sign-in page
**When** I view the authentication options
**Then** I see "Continue with Google" button with Google icon
**And** I see "Continue with GitHub" button with GitHub icon
**And** buttons are styled consistently with design system

**Given** I am on the sign-up page
**When** I view the registration options
**Then** I see the same social auth buttons
**And** they work for both new and existing accounts

**Given** I click "Continue with Google"
**When** OAuth flow initiates
**Then** I see a loading state on the button
**And** I am redirected to Google's auth page
**And** after authorization, I return to the app authenticated

**Given** I click "Continue with GitHub"
**When** OAuth flow initiates
**Then** I see a loading state on the button
**And** I am redirected to GitHub's auth page
**And** after authorization, I return to the app authenticated

**Given** OAuth fails (user cancels or error)
**When** I return to the app
**Then** I see a clear error message
**And** I can try again or use email/password

**Given** I sign in with social auth for the first time
**When** my account is created
**Then** my profile is populated with available data (name, avatar)
**And** I am directed to onboarding if applicable

---

## Story 2.7: User Profile Page

As a **signed-in user**,
I want **to view and edit my profile information**,
So that **I can personalize my account**.

**Acceptance Criteria:**

**Given** I am signed in
**When** I navigate to my profile page
**Then** I see my current profile information
**And** I see my email address (not editable)
**And** I see my username (editable)
**And** I see my display name (if set)

**Given** I want to set my username
**When** I enter a username
**Then** I see real-time availability check
**And** valid usernames show green checkmark
**And** taken usernames show error message

**Given** I enter an invalid username format
**When** I type in the username field
**Then** I see validation rules (alphanumeric, min/max length)
**And** invalid input is highlighted

**Given** I make changes to my profile
**When** I click "Save"
**Then** I see a loading state
**And** on success, I see "Profile updated!" toast
**And** changes are reflected immediately

**Given** I want to delete my account
**When** I look for account deletion
**Then** I find a clearly marked option
**And** I am warned about permanent data loss
**And** I must confirm the action explicitly

---

## Story 2.8: Auth UI Polish (Loading & Error States)

As a **user interacting with authentication forms**,
I want **clear feedback on my actions**,
So that **I know what's happening and can recover from errors**.

**Acceptance Criteria:**

**Given** I submit any auth form (sign-in, sign-up, reset)
**When** the request is processing
**Then** submit button shows loading spinner
**And** button is disabled to prevent double-submit
**And** form fields are disabled during processing

**Given** a form field has a validation error
**When** the error is detected (on blur or submit)
**Then** the field shows red border
**And** error message appears below the field
**And** error is specific and actionable

**Given** an auth action succeeds
**When** the operation completes
**Then** I see a success toast notification
**And** toast auto-dismisses after 5 seconds
**And** I can manually dismiss the toast

**Given** an auth action fails (network error)
**When** the request fails
**Then** I see an error toast with retry option
**And** form remains filled with my input
**And** I can retry without re-entering data

**Given** any auth form
**When** I press Enter in a form field
**Then** the form submits (if valid)
**And** focus management is correct

**Given** auth forms on mobile
**When** I interact with the form
**Then** keyboard doesn't obscure the input
**And** form scrolls appropriately
**And** submit button remains accessible

---

## UX Design Resources

> **DEVELOPER NOTE: DO NOT BUILD FROM SCRATCH**
>
> All designs contain **production-ready React/TypeScript code**.
> Use MagicPatterns MCP tools to extract code directly.
> See **[Component Strategy](../ux-design/epic-2-auth-component-strategy.md)** for full extraction workflow.

### Story-to-Design Mapping

| Story | Screen | MagicPatterns URL | Files to Extract |
|-------|--------|-------------------|------------------|
| 2.1 | Sign Up | [View](https://www.magicpatterns.com/c/bxmfv74lgsrvfdrwaeqcrt) | `SignUpPage.tsx` |
| 2.2 | Email Verification | [View](https://www.magicpatterns.com/c/3rhvxmnpjshhysr6p76xxd) | `EmailVerificationPage.tsx` |
| 2.3 | Sign In | [View](https://www.magicpatterns.com/c/uudzfo47fhnhhhzfhftkua) | `SignInForm.tsx`, `SignInPage.tsx` |
| 2.4 | Forgot Password | [View](https://www.magicpatterns.com/c/1xdwsbsectczdt1gpzyd5r) | `ForgotPasswordPage.tsx` |
| 2.5 | Reset Password | [View](https://www.magicpatterns.com/c/mvjem6dcsdqzubf6kpavmg) | `ResetPasswordPage.tsx` |
| 2.6 | Social Auth | [View](https://www.magicpatterns.com/c/uudzfo47fhnhhhzfhftkua) | `SocialAuthButtons` from `SignInForm.tsx` |
| 2.7 | Profile Settings | [View](https://www.magicpatterns.com/c/4a3nbxktcjxj3w13dqwk9x) | `ProfileCard.tsx`, `DangerZone.tsx` |
| 2.8 | Auth UI Polish | All above | Loading states, error handling patterns |

### Extraction Command

```
mcp__magic-patterns__read_files(url: "<design-url>", fileNames: ["<ComponentFile>.tsx"])
```

### Adaptation Checklist (Apply to All Extracted Code)

- [ ] Replace inline styles with project's Tailwind classes if different
- [ ] Swap custom inputs for shadcn `Input` component
- [ ] Add `"use client"` directive for Next.js
- [ ] Wire up to Supabase auth methods
- [ ] Add proper TypeScript types for form data
- [ ] Integrate with project's toast notifications
- [ ] Add i18n translations using `useTranslations`

### Required shadcn Components

```bash
# Already installed: button, input, label, form, toast, separator
# To install for this epic:
npx shadcn@latest add checkbox card avatar alert
```

### Reference Documents

- **Design Brief:** [epic-2-auth-design-brief.md](../ux-design/epic-2-auth-design-brief.md)
- **Component Strategy:** [epic-2-auth-component-strategy.md](../ux-design/epic-2-auth-component-strategy.md)
