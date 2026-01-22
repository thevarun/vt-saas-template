# Design Brief: Epic 2 - Complete Authentication Experience

**Date:** 2026-01-21
**Design Tool:** MagicPatterns
**Status:** Approved

---

> **DEVELOPER NOTE: DO NOT BUILD FROM SCRATCH**
>
> All designs below contain **production-ready React/TypeScript code**.
> Use MagicPatterns MCP tools to extract code directly:
> ```
> mcp__magic-patterns__read_files(url: "<design-url>", fileNames: ["<file>"])
> ```
> See **[Component Strategy](epic-2-auth-component-strategy.md#quick-start)** for full extraction workflow.

---

## Overview

Complete redesign of the authentication experience for VT SaaS Template, covering all user-facing auth flows from registration through profile management. The design establishes a cohesive, professional visual language inspired by Linear, Vercel, and Stripe.

## Scope

| Screen | Purpose | MagicPatterns URL |
|--------|---------|-------------------|
| Sign In | User login with email/password + social auth | [View](https://www.magicpatterns.com/c/uudzfo47fhnhhhzfhftkua) |
| Sign Up | New user registration | [View](https://www.magicpatterns.com/c/bxmfv74lgsrvfdrwaeqcrt) |
| Forgot Password | Request password reset | [View](https://www.magicpatterns.com/c/1xdwsbsectczdt1gpzyd5r) |
| Reset Password | Set new password from email link | [View](https://www.magicpatterns.com/c/mvjem6dcsdqzubf6kpavmg) |
| Email Verification | Post-registration verification prompt | [View](https://www.magicpatterns.com/c/3rhvxmnpjshhysr6p76xxd) |
| Profile Settings | User profile management + account deletion | [View](https://www.magicpatterns.com/c/4a3nbxktcjxj3w13dqwk9x) |

---

## Design Decisions

### Visual Direction

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Color Palette** | Slate grays + blue-600 accent | Professional, clean, high contrast |
| **Background** | Subtle gradient blur (blue/indigo) | Modern glass-morphism feel without being trendy |
| **Cards** | White with subtle border + shadow | Clear content hierarchy, elevated appearance |
| **Typography** | System font stack, slate-900 headings | Fast loading, readable, professional |

### Component Patterns

| Pattern | Implementation |
|---------|----------------|
| **Password Toggle** | Eye/EyeOff icons from Lucide, positioned right inside input |
| **Loading States** | Loader2 spinner in buttons, disabled state during processing |
| **Error States** | Red border + inline message below field |
| **Success States** | Green checkmark, brief confirmation message |
| **Social Buttons** | Side-by-side, 44px height, official brand icons |

### Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| **Form Validation** | Real-time for format, on-submit for required |
| **Resend Email** | 60-second cooldown with visible countdown |
| **Username Check** | Debounced API call (500ms), loading → available/taken |
| **Save Actions** | Loading spinner → success checkmark → reset |

---

## Inspiration Sources

1. **[Authgear UX Guide](https://www.authgear.com/post/login-signup-ux-guide)** - Password toggle placement, social button sizing, remember me positioning
2. **[shadcn/ui Login Blocks](https://ui.shadcn.com/blocks/login)** - Centered card layout, component structure
3. **Linear/Vercel** - Clean slate color palette, minimal aesthetic, professional polish

---

## Key Departures from Previous Design

| Previous | New |
|----------|-----|
| Gradient purple/pink/indigo headings | Clean slate-900 text |
| Colorful background gradient | Subtle blue/slate blur |
| Custom inline SVG icons | Lucide React icon library |
| Basic loading text | Spinner animations |
| No password visibility toggle | Eye icon toggle |
| No "Remember me" option | Checkbox with label |

---

## Related Stories

This design supports Epic 2 stories:
- Story 2.1: User Registration with Email/Password
- Story 2.2: Email Verification Flow
- Story 2.3: User Login with Session Management
- Story 2.4: Forgot Password Flow
- Story 2.5: Reset Password Page
- Story 2.6: Social Authentication (Google & GitHub)
- Story 2.7: User Profile Page
- Story 2.8: Auth UI Polish (Loading & Error States)
