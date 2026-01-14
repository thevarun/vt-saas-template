# Epic List

## Epic 1: Template Foundation & Modernization
**Goal:** Template users get a clean, upgraded foundation ready for customization

This epic handles the brownfield transformation - upgrading all dependencies to latest versions, rebranding from HealthCompanion to VT SaaS Template, and ensuring core infrastructure (CI/CD, error handling, responsive design, dark mode, i18n) works correctly after upgrades.

**FRs covered:** FR-CICD-001, FR-CICD-002, FR-ERROR-001, FR-ERROR-002, FR-UI-001, FR-UI-002, FR-I18N-001, FR-I18N-002

**Key Deliverables:**
- Next.js 15, React 19, Supabase latest, TypeScript 5.7+ upgrades complete
- All "HealthCompanion" references replaced with "VT SaaS Template"
- CI/CD pipeline validated and passing
- Error boundaries working at all levels
- Existing features (dark mode, i18n, responsive) validated post-upgrade

---

## Epic 2: Complete Authentication Experience
**Goal:** Users can register, login, reset passwords, and use social auth with polished flows

Complete end-to-end authentication system with all UI states including social auth buttons, forgot/reset password flows, email verification UI, and proper loading/error states.

**FRs covered:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, FR-AUTH-005

**Key Deliverables:**
- Email/password registration with validation
- Login with "Remember me" functionality
- User profile page with username setting
- Forgot password → email → reset password flow
- Google and GitHub OAuth buttons
- Email verification UI with resend capability
- All auth forms with loading states and error handling

---

## Epic 3: User Onboarding & Welcome
**Goal:** New users feel guided and welcomed, not dumped on empty dashboard

First-time user experience including post-signup wizard and helpful empty states throughout the application.

**FRs covered:** FR-ONB-001, FR-ONB-002, FR-UI-003, FR-UI-004

**Key Deliverables:**
- 3-step onboarding wizard (username, features, preferences)
- Skip option with ability to complete later
- Progress indicator
- Dashboard welcome state for new users
- Empty states with helpful CTAs throughout app
- Loading states (skeletons, spinners) for async content

---

## Epic 4: Email Communication System
**Goal:** Users receive professional transactional emails

Complete email infrastructure with React Email templates for all system communications.

**FRs covered:** FR-EMAIL-001, FR-EMAIL-002

**Key Deliverables:**
- Welcome email after signup
- Email verification with secure link
- Password reset email
- React Email templates (customizable)
- Resend integration (provider-agnostic pattern)
- Error handling for failed sends

---

## Epic 5: User Feedback Collection
**Goal:** Users can easily share feedback; admins can review and manage submissions

Simple but complete feedback loop from widget to admin review.

**FRs covered:** FR-FEED-001, FR-FEED-002

**Key Deliverables:**
- Feedback widget accessible from any page
- Type selection (bug/feature/praise)
- Confirmation message after submission
- Admin view of all submissions
- Filter by type, mark as reviewed
- CSV export capability

---

## Epic 6: Admin Panel & System Management
**Goal:** Admins can manage users and monitor system health

User management, system metrics dashboard, and role-based access control.

**FRs covered:** FR-ADMIN-001, FR-ADMIN-002, FR-ADMIN-003

**Key Deliverables:**
- Admin-protected routes
- User list with search
- User details view (signup date, last login, status)
- Account actions (suspend, delete, reset password)
- System metrics dashboard (users, signups, errors)
- Admin role via DB flag or env config
- Audit logging for admin actions

---

## Epic 7: SEO & Social Sharing Foundations
**Goal:** Product is discoverable; content is shareable with rich previews

Discoverability infrastructure for search engines and social platforms.

**FRs covered:** FR-SEO-001, FR-SEO-002, FR-SEO-003, FR-SEO-004

**Key Deliverables:**
- hreflang tags for all supported languages
- Open Graph metadata on key pages
- Twitter Card support
- robots.txt blocking authenticated routes
- Dynamic OG image generation (@vercel/og)
- Customizable OG image templates

---

## Epic 8: Go-To-Market Features
**Goal:** Pre-launch and growth infrastructure ready for product launches

Marketing and growth enablement features for launching products built on the template.

**FRs covered:** FR-GTM-001, FR-GTM-002, FR-GTM-003, FR-GTM-004, FR-GTM-005, FR-GTM-006

**Key Deliverables:**
- Share/referral widget component
- Private shareable URLs with access control
- Changelog-to-content automation (GitHub Action + LLM + n8n)
- Programmatic SEO page templates
- Pre-launch landing page with waitlist
- Social proof widgets (counters, testimonials, badges)

---

## Epic 9: Analytics & Founder Dashboard
**Goal:** Product owner can track user behavior and key conversion metrics

Instrumentation and insights infrastructure.

**FRs covered:** FR-ANALYTICS-001, FR-ANALYTICS-002, FR-ANALYTICS-003, FR-ANALYTICS-004

**Key Deliverables:**
- Event tracking utility (trackEvent wrapper)
- PostHog integration (swappable)
- User flow funnel tracking
- TypeScript types for events
- Dev mode: log to console
- Founder analytics dashboard (PostgreSQL-based)
- Key metrics: signups, activation, referrals, conversions

---

## Epic 10: AI Chat Integration (Example Module)
**Goal:** Template users see production-quality streaming patterns they can learn from or remove

Already exists from HealthCompanion - needs cleanup and documentation as example code. Route renamed to `/chat/dify`.

**FRs covered:** FR-CHAT-001, FR-CHAT-002

**Key Deliverables:**
- Clean up existing chat interface code
- Rename route to `/chat/dify`
- Document SSE streaming patterns
- Document API proxy pattern
- Clear removal instructions
- Mark as "example code" in documentation

---

## Epic 11: Vercel AI SDK Chat with Observability & Memory
**Goal:** Template users have an alternative chat implementation with full local control, observability, and optional persistent memory

Second chat implementation using Vercel AI SDK, giving downstream developers stack flexibility:
- **Dify** (`/chat/dify`) - Simple, managed, minimal setup
- **Vercel AI SDK** (`/chat/vercel`) - Full control, observable, extensible

**Key Deliverables:**
- Vercel AI SDK integration with OpenAI (provider-swappable)
- LangFuse integration for LLM observability
- Mem0 integration for persistent memory (opt-in, async extraction)
- Local PostgreSQL storage for conversations/messages
- Conversation history UI with sidebar navigation
- Comprehensive developer documentation
- Clear removal instructions

**New Database Tables:**
- `vercel_conversations` - Chat session metadata
- `vercel_messages` - Individual messages with token tracking
- `mem0_memories` - Extracted user memories
- `memory_extraction_jobs` - Async processing queue

**Dependencies:** ai, @ai-sdk/openai, langfuse, mem0ai (optional)

---
