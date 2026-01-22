# Component Strategy: Epic 2 - Complete Authentication Experience

**Date:** 2026-01-21
**Design Tool:** MagicPatterns (React/TypeScript output)

---

## Quick Start

### 1. Extract Code from MagicPatterns

The designs contain **production-ready React/TypeScript code**. Use MagicPatterns MCP to pull the code directly:

```bash
# In Claude Code, use mcp__magic-patterns__read_files to extract:
```

| Screen | URL | Key Files to Extract |
|--------|-----|---------------------|
| Sign In | [View](https://www.magicpatterns.com/c/uudzfo47fhnhhhzfhftkua) | `SignInForm.tsx`, `SignInPage.tsx` |
| Sign Up | [View](https://www.magicpatterns.com/c/bxmfv74lgsrvfdrwaeqcrt) | `SignUpPage.tsx` |
| Forgot Password | [View](https://www.magicpatterns.com/c/1xdwsbsectczdt1gpzyd5r) | `ForgotPasswordPage.tsx` |
| Reset Password | [View](https://www.magicpatterns.com/c/mvjem6dcsdqzubf6kpavmg) | `ResetPasswordPage.tsx` |
| Email Verification | [View](https://www.magicpatterns.com/c/3rhvxmnpjshhysr6p76xxd) | `EmailVerificationPage.tsx` |
| Profile Settings | [View](https://www.magicpatterns.com/c/4a3nbxktcjxj3w13dqwk9x) | `ProfileCard.tsx`, `DangerZone.tsx` |

**Workflow:**
1. Use `mcp__magic-patterns__read_files` to extract the component code
2. Adapt styling to use project's existing shadcn components
3. Replace mock logic with Supabase auth calls
4. Add react-hook-form + zod validation

### 2. Install Required shadcn Components

```bash
npx shadcn@latest add checkbox card avatar alert
```

**Already Installed:** button, input, label, form, toast, separator

---

## Component Mapping

### Auth Form Elements

| UI Element | shadcn Component | Custom Work |
|------------|------------------|-------------|
| Email input | `Input` | Add email type, placeholder |
| Password input | `Input` | **Build:** PasswordInput wrapper with toggle |
| Remember me | `Checkbox` + `Label` | Compose together |
| Submit button | `Button` | Add loading state with Loader2 |
| Social buttons | `Button` variant="outline" | Add icons, 44px height |
| Error message | Inline `<p>` | Red text, slide-in animation |
| Form card | `Card` | Backdrop blur, gradient bg |

### Profile Elements

| UI Element | shadcn Component | Custom Work |
|------------|------------------|-------------|
| Avatar | `Avatar` | Add upload button overlay |
| Username input | `Input` | **Build:** With availability check indicator |
| Read-only email | `Input` disabled | Lock icon prefix |
| Save button | `Button` | Loading → success state |
| Danger zone | `Card` + `Alert` | Red accent border |
| Delete button | `Button` variant="destructive" | Confirmation dialog |

---

## Custom Components to EXTRACT (Not Build)

> **These patterns are already implemented in MagicPatterns.**
> Extract the logic using `mcp__magic-patterns__read_files`, then wrap in reusable components.

### 1. PasswordInput

**Purpose:** Input with show/hide toggle for password fields

**Source:** Extract from `SignInForm.tsx` (password field section)

**Location:** `src/components/ui/password-input.tsx`

```typescript
// Props extend InputProps
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Inherits all input props
}

// Features:
// - Eye/EyeOff toggle button (right side)
// - Toggle between type="password" and type="text"
// - aria-label for accessibility
```

**Implementation Notes:**
- Use `useState` for visibility toggle
- Icons: `Eye`, `EyeOff` from lucide-react
- Button should be `type="button"` to prevent form submit

---

### 2. SocialAuthButton

**Purpose:** Styled OAuth buttons for Google and GitHub

**Source:** Extract from `SignInForm.tsx` (social buttons section - includes Google SVG icon)

**Location:** `src/components/auth/social-auth-button.tsx`

```typescript
interface SocialAuthButtonProps {
  provider: 'google' | 'github'
  isLoading?: boolean
  onClick?: () => void
}

// Features:
// - Official brand icons (inline SVG for Google, Lucide for GitHub)
// - 44px minimum height (accessibility)
// - Loading state with spinner
// - Consistent styling across providers
```

**Implementation Notes:**
- Google icon must use official multi-color SVG (brand requirement)
- GitHub icon from lucide-react is acceptable
- Use `Button` variant="outline" as base

---

### 3. ResendEmailButton

**Purpose:** Button with cooldown timer for email resend

**Source:** Extract from `EmailVerificationPage.tsx` (complete cooldown logic with useEffect)

**Location:** `src/components/auth/resend-email-button.tsx`

```typescript
interface ResendEmailButtonProps {
  onResend: () => Promise<void>
  cooldownSeconds?: number // default: 60
}

// States:
// - idle: "Resend email" with refresh icon
// - loading: Spinner + "Sending..."
// - success: Checkmark + "Email sent!"
// - cooldown: "Resend in 59s" (countdown)
```

**Implementation Notes:**
- Use `useEffect` with `setInterval` for countdown
- Clear interval on unmount
- Disable button during loading and cooldown

---

### 4. UsernameInput

**Purpose:** Input with real-time availability checking

**Source:** Extract from `ProfileCard.tsx` (complete debounce + availability check logic)

**Location:** `src/components/auth/username-input.tsx`

```typescript
interface UsernameInputProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange?: (available: boolean) => void
}

// States (right indicator):
// - idle: nothing
// - checking: Loader2 spinner (blue)
// - available: Check icon (green) + "Available" text
// - taken: X icon (red) + "Username taken" error
```

**Implementation Notes:**
- Debounce API call (500ms delay)
- Filter input to alphanumeric only
- Show helper text: "3-20 characters, letters and numbers only"

---

## shadcn Component Details

### Checkbox (to install)

**Usage:** "Keep me signed in" option on sign-in page

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center space-x-2">
  <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
  <Label htmlFor="remember">Keep me signed in</Label>
</div>
```

### Card (to install)

**Usage:** Auth form containers

```tsx
import { Card, CardContent } from "@/components/ui/card"

<Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-slate-200/50 shadow-xl">
  <CardContent className="p-8 sm:p-10">
    {/* Form content */}
  </CardContent>
</Card>
```

### Avatar (to install)

**Usage:** Profile settings page

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar className="h-20 w-20">
  <AvatarImage src={user.avatarUrl} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>
```

---

## MagicPatterns Code - What to Reuse

Each MagicPatterns design has **tested, working code**. Here's what to extract and adapt:

| Design | What to Keep | What to Replace |
|--------|--------------|-----------------|
| **SignInForm.tsx** | Password toggle logic, form layout, loading states, social button grid | Validation → react-hook-form + zod, Auth → Supabase |
| **SignUpPage.tsx** | Password requirements display, form structure | Same as above |
| **ForgotPasswordPage.tsx** | Success state transition, email confirmation UI | API call → Supabase resetPasswordForEmail |
| **ResetPasswordPage.tsx** | Password match validation, success screen | API call → Supabase updateUser |
| **EmailVerificationPage.tsx** | Cooldown timer logic (useEffect + setInterval), state machine | Resend → Supabase resend |
| **ProfileCard.tsx** | Username debounce check, availability indicator states | API → custom endpoint or Supabase RPC |
| **DangerZone.tsx** | Warning UI, confirmation pattern | Delete → Supabase admin delete |

**Adaptation Checklist:**
- [ ] Replace inline styles with project's Tailwind classes if different
- [ ] Swap custom inputs for shadcn `Input` component
- [ ] Add `"use client"` directive for Next.js
- [ ] Wire up to Supabase auth methods
- [ ] Add proper TypeScript types for form data
- [ ] Integrate with project's toast notifications

---

## Implementation Priority

| Priority | Component | Blocks |
|----------|-----------|--------|
| 1 | PasswordInput | All password forms |
| 2 | SocialAuthButton | Sign-in, Sign-up |
| 3 | Checkbox install | Sign-in "Remember me" |
| 4 | Card install | All auth pages layout |
| 5 | ResendEmailButton | Email verification |
| 6 | UsernameInput | Profile settings |
| 7 | Avatar install | Profile settings |

---

## What NOT to Do

| Don't | Instead |
|-------|---------|
| Build form layouts from scratch | Extract from MagicPatterns page components |
| Create your own password toggle UI | Extract from `SignInForm.tsx` |
| Implement cooldown timer logic | Extract from `EmailVerificationPage.tsx` |
| Design social button styles | Extract from `SignInForm.tsx` (includes Google SVG) |
| Build username availability check | Extract from `ProfileCard.tsx` |
| Write CSS for auth cards | Extract Tailwind classes from MagicPatterns |

---

## Icon Reference

All icons from `lucide-react`:

```tsx
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ArrowLeft,
  Mail,
  Lock,
  KeyRound,
  Github,
  User,
  Camera,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
```
