---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-functional', 'step-07-nonfunctional', 'step-08-technical', 'step-09-constraints', 'step-10-validation', 'step-11-complete']
inputDocuments:
  - /Users/varuntorka/Coding/HealthCompanion/docs/index.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/project-overview.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/architecture.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/component-inventory.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/data-models.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/api-contracts.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/development-guide.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/deployment-guide.md
  - /Users/varuntorka/Coding/HealthCompanion/docs/source-tree-analysis.md
workflowType: 'prd'
lastStep: 11
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 9
---

# Product Requirements Document - VT SaaS Template

**Author:** Varun
**Date:** 2026-01-05

## Executive Summary

**VT SaaS Template** is a production-ready Next.js 15 starter template designed for rapid SaaS application development. Built from a real production application (HealthCompanion AI health coach), this template provides the essential infrastructure and features needed to launch a modern SaaS product without the weeks of boilerplate setup.

This PRD defines the transformation of the existing HealthCompanion application into a general-purpose SaaS template by removing domain-specific features, adding core SaaS modules, upgrading to the latest Next.js ecosystem (Next.js 15, React 19, latest Supabase SDK), and ensuring production deployment readiness with working CI/CD pipelines.

**User Experience Vision:**
Users experience a polished, professional SaaS interface from first signup - streamlined authentication flows with proper error handling and loading states, an intuitive dashboard that demonstrates best practices for data presentation, and thoughtful empty states that guide rather than confuse. The post-signup onboarding wizard sets the tone for quality, showing template users that this foundation cares about user experience, not just technical architecture.

### What Makes This Special

Unlike typical "hello world" Next.js starters, VT SaaS Template is **modular by design**—Auth, feedback collection, user profiles, and admin panel are cleanly separated modules with clear interfaces. Remove what you don't need without breaking the build. The template ships with essential SaaS components developers actually need while remaining easy to customize or replace for specific use cases.

The template embodies **production-proven from day one** philosophy: not a weekend project, this ran a live SaaS with real users, real authentication flows, real data management patterns, and real bugs that got fixed. Proper CI/CD pipelines, working deployment configuration, battle-tested error boundaries, email infrastructure, and modern best practices are baked in through actual production experience.

**Key differentiators:**

- **Battle-tested patterns**: Production-proven implementations for auth flows, real-time streaming (SSE), multi-user data isolation (thread management per user), edge middleware orchestration, and serverless deployment. These patterns survived real users, not just test suites.

- **Design system ready**: Complete shadcn/ui component library with 38+ production-tested components, responsive patterns across mobile/tablet/desktop, dark mode support, and accessibility primitives. Template users inherit a professional design foundation with reusable patterns, not bare-bones styling.

- **Modern stack with clear upgrade path**: Latest Next.js 15 with App Router, React 19 Server Components, Supabase Auth V2, Drizzle ORM, and TypeScript 5.7+. Migration paths documented for future upgrades.

- **Zero vendor lock-in**: Supabase client is swappable (standard PostgreSQL + Auth interface), AI integration is example code (Dify streaming can be replaced with OpenAI/Anthropic), email system uses standard patterns (adapt to any transactional email service), and state management uses React primitives (no opinionated libraries).

- **Example integrations as learning material**: AI chat streaming integration (Dify) remains as production-quality example code showing how to implement Server-Sent Events, proxy external APIs securely, and manage conversation state. Template users can keep, customize, or remove based on their needs.

- **Developer experience focus**: Working CI/CD (GitHub Actions), proper error handling throughout, modular architecture with clear separation of concerns, comprehensive environment variable documentation, and deployment proven on Vercel with alternative platform instructions.

**Skill Level:** This template assumes intermediate to advanced Next.js knowledge - familiarity with App Router, Server Components, server actions, and modern React patterns. This is a feature, not a bug: we're not dumbing down the architecture for beginners.

## Project Classification

**Technical Type:** saas_b2b / web_app
**Domain:** general (general-purpose SaaS template)
**Complexity:** medium
**Project Context:** Brownfield - transforming existing HealthCompanion app into reusable template

**Current Architecture:**
- **Framework**: Next.js 14 (App Router) → **upgrading to Next.js 15**
- **React**: 18.3.1 → **upgrading to React 19**
- **Runtime**: Serverless full-stack monolith
- **Auth**: Supabase Auth V2 with SSR support
- **Database**: PostgreSQL + Drizzle ORM (migration system included)
- **UI**: TypeScript 5.6+ → 5.7+, Tailwind CSS 3.4, shadcn/ui component system (38+ components)
- **Infrastructure**: Edge middleware, serverless API routes, React Server Components
- **Existing Features (Template Examples)**:
  - AI chat streaming (Dify) - **example integration to keep/customize/remove**
  - Thread management CRUD - **demonstrates data patterns, stays as reference**
  - Multi-language support (en/hi/bn) - **i18n infrastructure, template users customize languages**

**Transformation Scope:**

This PRD covers the conversion from a specialized health coaching application to a general-purpose SaaS template through:

1. **Dependency upgrades and modernization**: Next.js 15, React 19, latest Supabase SDK, Drizzle ORM updates, security patches across all dependencies
2. **Rebranding and generalization**: Remove "HealthCompanion" references, replace with "VT SaaS Template", remove health-specific messaging, create generic placeholders
3. **Core SaaS feature additions**: User feedback widget, user profile/settings scaffolding (with username example), onboarding wizard, basic admin panel
4. **Infrastructure improvements**: GitHub Actions CI/CD pipeline, transactional email system setup (Resend/React Email), error boundaries throughout app, rate limiting documentation
5. **UX polish**: Streamlined auth experience (loading states, error handling, success feedback), refined dashboard with empty states and onboarding prompts, professional visual consistency
6. **Production readiness**: Deployment validation on Vercel, working environment variable configuration, translation system functioning (i18n), database migration strategy documented

**Migration Strategy Notes:**
- Supabase Auth V1 → V2 migration (breaking changes documented)
- Next.js 14 App Router → Next.js 15 (async params/searchParams updates)
- React 18 → React 19 (new hooks, server actions patterns)
- Database schema migrations via Drizzle (version-controlled SQL files)

The template will serve as the foundation for future projects, providing proven architecture patterns with essential SaaS components ready to customize. Users can reference the AI chat integration as example code for advanced features or remove it entirely if not needed.

## Success Criteria

### User Success

**Primary Success Metric**: Template users (developers) can fork, customize, and deploy a professional SaaS application in **under 1 week** instead of the typical 3-4 weeks of boilerplate setup.

**User Success Moments:**

1. **First 30 minutes**: Developer forks template, updates `.env.local`, runs `npm install && npm run dev` - sees a working SaaS with auth, dashboard, and example features
2. **First 2 hours**: Rebrands UI (logo, colors, app name), customizes onboarding flow, deploys to Vercel staging - "this actually works"
3. **First day**: Understands the architecture by reading the AI chat integration example, modifies or removes it confidently - "I can extend this without breaking it"
4. **First week**: Adds custom business logic, integrates domain-specific features, ships to production - "I just launched a SaaS in a week"

**User Delight Indicators:**
- Developer doesn't need to set up auth from scratch (Supabase "just works")
- CI/CD pipeline passes without configuration (GitHub Actions pre-configured)
- Example code teaches patterns (SSE streaming, API proxying, edge middleware) without being toy code
- Modularity allows removing features (admin panel, feedback widget) without breaking the build

### Business Success

**3-Month Success Criteria:**
- VT SaaS Template fully transformed and deployed as a working template
- All "HealthCompanion" references removed, documentation updated
- Successfully used to bootstrap **1 new project** with 70%+ time savings vs. starting from scratch
- Template is "fork-ready" - no known blockers for starting new projects

**12-Month Success Criteria:**
- **3-5 projects** successfully launched using this template foundation
- Each project fork-to-deploy takes **under 1 week** for MVP
- Template maintenance is minimal (dependency updates 1x/quarter)
- Template serves as reference architecture for team standards

**Key Business Metric:**
"Can I fork this template on Monday and deploy a new SaaS MVP by Friday?" - **Answer must be YES**

### Technical Success

**Transformation Completion Criteria:**

1. **Dependency Modernization** ✅
   - Next.js 15+ installed and working
   - React 19 with new hooks/server actions
   - Latest Supabase Auth SDK (v2)
   - TypeScript 5.7+, Tailwind CSS 3.4+
   - All security patches applied
   - `npm audit` shows 0 high/critical vulnerabilities

2. **Rebranding Complete** ✅
   - Zero references to "HealthCompanion" in codebase
   - All instances replaced with "VT SaaS Template"
   - Generic placeholder content (not health-specific)
   - Documentation updated with template context

3. **Core SaaS Features Functional** ✅
   - User feedback widget working (submit feedback → stored in DB)
   - User profile page with settings (username setting working end-to-end)
   - Post-signup onboarding flow (wizard → set preferences → dashboard)
   - Basic admin panel (view users, system stats)

4. **Infrastructure & DevOps** ✅
   - GitHub Actions CI/CD pipeline passing (lint, type check, test, build)
   - Email system configured (welcome email, password reset working)
   - Error boundaries at app, route, and component levels
   - Environment variables documented and validated

5. **UX Polish** ✅
   - Auth flows: loading states, error messages, success feedback
   - Dashboard: empty states, onboarding prompts, professional layout
   - Responsive design working across mobile/tablet/desktop
   - Dark mode functional

6. **Production Readiness** ✅
   - Successful deployment to Vercel production environment
   - All 3 languages (en/hi/bn) rendering correctly
   - Database migrations running successfully
   - No runtime errors in production logs for 48 hours post-deploy

### Measurable Outcomes

**Quality Gates:**
- **Build Success**: `npm run build` completes with 0 errors, 0 TypeScript errors
- **Test Coverage**: Core modules (auth, profiles, feedback) have working test examples
- **Performance**: Lighthouse score 90+ (Performance, Accessibility, Best Practices)
- **Deployment**: Vercel deployment completes in under 5 minutes from git push

**Developer Experience Metrics:**
- **Time to First Deploy**: Under 30 minutes from fork to staging deployment
- **Time to Customize**: Under 2 hours to rebrand (name, logo, colors, content)
- **Time to Production**: Under 1 week from fork to production-ready custom SaaS

## Product Scope

### MVP - Minimum Viable Product

**Must-Have for Template to Be Usable:**

1. **Dependency Upgrades**
   - Next.js 15, React 19, latest Supabase SDK
   - All critical security patches applied

2. **Rebranding**
   - All "HealthCompanion" → "VT SaaS Template" references replaced
   - Generic content (no health-specific text)

3. **Core SaaS Modules**
   - User profile page with username setting (working end-to-end)
   - User feedback widget (simple form → DB storage)
   - Post-signup onboarding (3-step wizard minimum)

4. **Auth & Dashboard UX**
   - Complete Tier 1 Auth UI/UX (FR-AUTH-005): forgot/reset password, social auth buttons, email verification UI
   - Streamlined sign-in/sign-up flows with proper error handling and loading states
   - Dashboard with welcome state and navigation
   - Error boundaries preventing white screens

5. **CI/CD & Deployment**
   - GitHub Actions workflow (lint, type check, build)
   - Successful Vercel production deployment
   - Environment variable documentation

6. **Translations Working**
   - All 3 languages (en/hi/bn) rendering without errors
   - Language switcher functional

### Growth Features (Post-MVP)

**Nice-to-Have, Can Be Added After Initial Template Launch:**

1. **Enhanced Admin Panel**
   - User management (view, edit, delete users)
   - System analytics dashboard
   - Feature flag controls

2. **Email System Complete**
   - Full transactional email suite (welcome, password reset, notifications)
   - Email template customization guide
   - React Email integration examples

3. **Advanced Onboarding**
   - Multi-path onboarding based on user type
   - Progress tracking
   - Skip/resume functionality

4. **Enhanced Feedback Module**
   - Screenshot capture with feedback
   - Feedback categorization (bug/feature/praise)
   - Admin interface for reviewing feedback

5. **Testing Examples**
   - Comprehensive test coverage examples (70%+)
   - E2E test suite for critical paths
   - Visual regression testing setup

6. **Go-To-Market Features**
   - Referral/share widget for user-generated content
   - Private shareable URLs with access control
   - Changelog-to-content automation (GitHub Action + LLM + n8n)
   - Programmatic SEO infrastructure (JSON data source + page templates)
   - Pre-launch landing page with waitlist capture
   - Social proof widgets (static testimonials, counters, trust badges)
   - Dynamic Open Graph image generation
   - Founder analytics dashboard (internal metrics from PostgreSQL)

### Vision (Future)

**Future Enhancements When Template Is Proven:**

1. **Multi-Template Variants**
   - SaaS B2B variant (with team/workspace features)
   - Mobile-first variant
   - AI-focused variant (enhanced Dify integration examples)

2. **Template Generator CLI**
   - Interactive CLI to customize template before forking
   - `npx create-vt-saas` bootstrapping tool

3. **Component Library**
   - Extract shadcn/ui components to separate package
   - Reusable across multiple projects

4. **Advanced Features**
   - Billing/subscription module (Stripe integration)
   - Multi-tenancy support (workspace model)
   - Advanced role-based permissions

## User Journeys

**Journey 1: Alex Chen - The Weekend Side Project Turned Real**

Alex is a full-stack developer with 5 years of experience who's been building the same authentication boilerplate for the third time this year. Friday night, while researching Next.js 15 templates, he discovers VT SaaS Template on GitHub. The README promises "production-ready in under a week" - he's skeptical but intrigued.

Saturday morning, Alex forks the repo, updates his `.env.local` with fresh Supabase credentials, and runs `npm install && npm run dev`. Within 20 minutes, he's looking at a fully functional SaaS with working auth, a professional dashboard, and even an AI chat example. He signs up with his email, sees the onboarding wizard, and thinks "wait, this actually works?"

He spends the next 2 hours customizing the branding - swaps out the logo, updates the color scheme to his startup's palette, and changes "VT SaaS Template" to "TaskFlow Pro". By lunch, he's deployed to Vercel staging and sends the link to his co-founder. The CI/CD pipeline passed on first try.

The breakthrough moment comes Monday when he reads through the AI chat integration code. Instead of toy example code, he finds production-quality patterns for SSE streaming, API proxying, and state management. He realizes he can adapt this pattern for his webhook notification system. By Friday, he's launching TaskFlow Pro MVP with custom business logic, and the template's foundation handled everything else. "I just shipped a SaaS in 5 days," he posts on Twitter.

**Journey 2: Jamie Rodriguez - The Architecture Decision**

Jamie is a CTO at a 15-person startup evaluating Next.js templates for their new B2B platform. They've been burned before by "starter templates" that looked great in demos but fell apart in production. She needs something her team can actually build on for 2+ years.

She starts by reading the VT SaaS Template README and documentation. The "battle-tested patterns" claim catches her eye - it was extracted from a real production app. She clones the repo and reviews the codebase architecture, checking middleware patterns, error boundaries, and test setup. The Supabase integration looks solid, and she likes that it's not locked to any specific vendor.

Jamie spins up a test deployment and runs it through her security checklist: proper auth flows, error handling, environment variable validation. She intentionally breaks things - invalid credentials, network failures, concurrent requests - and is impressed when the error boundaries prevent white screens and the recovery UX is polished.

The decision point comes when she discovers the migration strategy documentation. Next.js 14 → 15, React 18 → 19, Supabase Auth V2 - all the upgrade paths are documented because they actually did these migrations. She shows the template to her senior engineer, who spots the modular architecture and says "we can work with this."

Two weeks later, Jamie's team has forked the template and built their first feature. The CI/CD pipeline caught a type error before deployment, the admin panel helped them debug a user issue, and the error tracking integration with Sentry "just worked." She emails Varun a thank you - this template saved them 4 weeks of infrastructure work.

**Journey 3: Sam Taylor - The First-Time User**

Sam is a freelance writer who just signed up for an app built with VT SaaS Template (let's call it "WriteTrack"). She's skeptical of new tools - too many have terrible onboarding experiences that waste her time.

The sign-up form is clean and simple - email and password, no unnecessary fields. After confirming her email, instead of being dumped on a confusing dashboard, she sees a friendly 3-step onboarding wizard. Step 1 asks for her username (she picks "sam_writes"), Step 2 shows her the main features with screenshots, Step 3 lets her customize notification preferences. The whole thing takes 90 seconds.

When she reaches the dashboard, Sam doesn't see an overwhelming grid of empty cards. Instead, there's a welcoming message: "Welcome to WriteTrack, Sam! Let's get you started..." with clear next actions. The empty states aren't just blank - they have helpful illustrations and "Get Started" buttons that actually make sense.

Later, when Sam wants to change her profile settings, the navigation is intuitive. When she submits feedback about wanting a dark mode toggle, a simple widget pops up and confirms "Thanks! We've received your feedback." She thinks, "This feels professional - not like those other indie tools."

The best part? Everything works smoothly on her phone. Responsive design isn't an afterthought. When she switches to Hindi (her preferred language), the entire interface translates seamlessly. Sam becomes a paying customer after the trial because the experience is "actually polished."

**Journey 4: Taylor Kim - The Accidental Admin**

Taylor is a developer who launched an app using VT SaaS Template three months ago. It's gaining traction - 300 users now - and she's become the de facto admin, support person, and operations manager. She never planned for this role, but users need help.

A user emails: "I can't log in, and my account seems stuck." Before VT SaaS Template, Taylor would have been digging through database queries and logs manually. Instead, she opens the admin panel, searches for the user's email, and sees their account status immediately. There's a clean user management interface showing account creation date, last login, and activity status.

She can see the user's recent activity, check if there are any error logs associated with their account, and spots the issue - they hit rate limits from too many failed login attempts. With a single click, she resets their rate limit status. The user can log in immediately.

The admin panel also shows system health - how many users signed up this week, error rates, and Feedback submissions from the widget. When users submit feedback, Taylor can categorize them (bug/feature/praise) and mark them as addressed. She doesn't need a separate tool - it's all in the template's admin interface.

During a critical moment when deployment fails, Taylor checks the CI/CD pipeline in GitHub Actions. The error message is clear - a TypeScript error in her latest commit. She fixes it, pushes, and the automated pipeline runs all checks (lint, type check, build) before deploying. "Thank god for this safety net," she thinks, realizing the template's infrastructure choices saved her from shipping broken code.

### Journey Requirements Summary

**From Alex's Journey (Solo Developer - Happy Path):**
- Quick setup: clone → configure → run in under 30 minutes
- Working authentication out of the box (Supabase)
- Professional dashboard with real UX polish
- Deployment automation (CI/CD, Vercel integration)
- Production-quality example code (AI chat, SSE streaming)
- Easy customization: branding, colors, content
- Modular architecture for adding custom features

**From Jamie's Journey (CTO - Evaluation/Production Confidence):**
- Comprehensive documentation (architecture, migration paths)
- Security best practices (error handling, auth patterns, env validation)
- Error boundaries and graceful failure recovery
- Non-opinionated, swappable integrations (no vendor lock-in)
- Proven migration strategy for dependency upgrades
- Test infrastructure setup
- Admin capabilities for team usage

**From Sam's Journey (End User Experience):**
- Streamlined sign-up (minimal friction)
- Guided onboarding wizard (3-step, skippable)
- Empty states with helpful guidance
- Responsive design (mobile/tablet/desktop)
- Multi-language support (i18n working)
- User feedback widget
- Professional, polished UI consistently

**From Taylor's Journey (Admin/Operations):**
- Admin panel for user management
- User search and account status visibility
- System health monitoring (errors, signups, activity)
- Feedback collection and management
- CI/CD safety nets (automated checks before deployment)
- Clear error messages and debugging tools
- Integrated tooling (no separate admin systems needed)

## Domain Requirements

### Domain Context

**Domain:** General-Purpose SaaS Development
**Complexity Level:** Low (no specialized regulatory or compliance requirements)

VT SaaS Template is designed to be domain-neutral - it provides the essential SaaS infrastructure without imposing domain-specific constraints. Template users will add their own domain requirements when building specific applications.

### General SaaS Best Practices

**Security & Privacy:**
- Secure authentication patterns (password hashing, session management)
- Environment variable protection (secrets never in client code)
- HTTPS enforcement for production deployments
- Basic rate limiting documentation
- GDPR-friendly patterns (user data export, account deletion)

**Performance Standards:**
- Lighthouse score 90+ for Performance, Accessibility, Best Practices
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Serverless function cold start < 500ms

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper ARIA labels and semantic HTML
- Color contrast ratios meeting standards

**Data Management:**
- PostgreSQL best practices (indexes, migrations, schemas)
- Type-safe database queries (Drizzle ORM)
- Audit trails (created_at, updated_at timestamps)
- Data validation at API boundaries

### No Domain-Specific Requirements

Unlike healthcare, fintech, or legal tech applications, this template does NOT require:
- ❌ Regulatory approvals (FDA, FINRA, etc.)
- ❌ Specialized compliance (HIPAA, PCI-DSS, SOC 2)
- ❌ Domain-specific certifications
- ❌ Industry-standard data formats or protocols
- ❌ Specialized audit or reporting requirements

**Rationale:** Template users will implement their own domain requirements. The template provides secure, scalable patterns that can adapt to any domain's needs.

## Functional Requirements

### Authentication & User Management

**FR-AUTH-001: User Registration**
- Users can create accounts with email and password
- Email verification required before account activation
- Password strength requirements enforced (min 8 chars, complexity)
- Duplicate email detection and clear error messaging
- Support for OAuth providers (Google, GitHub) - infrastructure ready

**FR-AUTH-002: User Login**
- Email/password authentication
- "Remember me" functionality
- Password reset via email
- Session management with automatic refresh
- Proper error handling (invalid credentials, rate limiting)

**FR-AUTH-003: User Profile**
- View and edit basic profile information
- Username setting (unique, validated)
- Profile picture upload (future enhancement, infrastructure ready)
- Account deletion capability (GDPR compliance)

**FR-AUTH-004: Session Management**
- Secure session storage (HTTP-only cookies)
- Automatic session refresh
- Multi-device session support
- Session timeout after inactivity

**FR-AUTH-005: Authentication UI/UX (Tier 1)**
- **Forgot/Reset Password Flow:**
  - "Forgot password?" link on sign-in page
  - Email input form to request password reset
  - Success message after request ("Check your email")
  - Reset password page (accessed via email link)
  - Confirmation message after successful password reset
  - Error handling for expired/invalid reset tokens
- **Social Authentication Buttons:**
  - Google sign-in button on sign-in/sign-up pages
  - GitHub sign-in button on sign-in/sign-up pages
  - Loading states during OAuth redirect
  - Error handling if social auth fails (clear messaging)
  - Consistent button styling matching template design system
- **Email Verification UI:**
  - "Verify your email" message displayed after signup
  - "Resend verification email" button with cooldown timer
  - Verification success page (after clicking email link)
  - Blocked/restricted state if accessing app without verification
  - Clear messaging about email verification requirement
- **Loading & Error States:**
  - Loading spinners on form submissions
  - Disabled state for submit buttons during processing
  - Field-level validation errors (inline)
  - Toast notifications for success/error feedback
  - Network error recovery messaging
- **Responsive Design:**
  - All auth flows work seamlessly on mobile/tablet/desktop
  - Touch-friendly buttons and form elements
  - Proper keyboard handling and accessibility

### Onboarding

**FR-ONB-001: Post-Signup Wizard**
- 3-step onboarding flow after email confirmation
- Step 1: Set username
- Step 2: Feature introduction with visuals
- Step 3: Preference configuration (notifications, language)
- Skip option available (can complete later)
- Progress indicator showing current step

**FR-ONB-002: Dashboard Welcome State**
- First-time user greeting with personalization
- Quick-start guide with actionable next steps
- Empty states with helpful guidance
- Feature discovery prompts

### User Feedback

**FR-FEED-001: Feedback Widget**
- Simple feedback form accessible from any page
- Fields: feedback text (required), type (bug/feature/praise)
- Anonymous or authenticated feedback
- Confirmation message after submission
- Storage in database for admin review

**FR-FEED-002: Feedback Management**
- Admin can view all feedback submissions
- Filter by type (bug/feature/praise)
- Mark feedback as reviewed/addressed
- Export feedback data (CSV)

### Admin Panel

**FR-ADMIN-001: User Management**
- View list of all users
- Search users by email, username, or ID
- View user details (signup date, last login, activity status)
- User account actions (suspend, delete, reset password)

**FR-ADMIN-002: System Monitoring**
- Dashboard with key metrics:
  - Total users, new signups this week/month
  - Active users (logged in last 7 days)
  - Error rate and recent errors
  - Feedback submissions count
- System health indicators

**FR-ADMIN-003: Access Control**
- Admin role assigned via database flag or environment configuration
- Admin-only routes protected by middleware
- Admin actions logged for audit trail

### Internationalization (i18n)

**FR-I18N-001: Multi-Language Support**
- Support for English, Hindi, Bengali (extendable to more)
- Language switcher in header
- Persistent language preference (stored in user settings or cookie)
- All UI text translatable
- RTL support infrastructure (for future languages)

**FR-I18N-002: Content Translation**
- Translation files in JSON format (`locales/en.json`, etc.)
- Dynamic content loading based on selected language
- Fallback to English if translation missing

### Email System

**FR-EMAIL-001: Transactional Emails**
- Welcome email after signup
- Email verification with link
- Password reset email with secure token
- Email templates using React Email (customizable)
- SMTP configuration via environment variables

**FR-EMAIL-002: Email Delivery**
- Integration with Resend or similar service
- Error handling for failed sends
- Email queue for reliability (future enhancement)

### CI/CD & Deployment

**FR-CICD-001: Automated Testing**
- GitHub Actions workflow triggered on push and PR
- Automated checks: ESLint, TypeScript type checking, unit tests, build
- PR cannot merge if checks fail
- Build artifacts cached for faster runs

**FR-CICD-002: Deployment Pipeline**
- Automatic deployment to Vercel on push to main branch
- Preview deployments for pull requests
- Environment variable management per environment (dev/staging/prod)
- Database migrations applied automatically on deployment

### Error Handling

**FR-ERROR-001: Error Boundaries**
- React error boundaries at app, route, and component levels
- Graceful fallback UI (no white screens of death)
- Error logging to Sentry with context
- User-friendly error messages

**FR-ERROR-002: API Error Handling**
- Consistent error response format (code, message, details)
- HTTP status codes used correctly (400, 401, 404, 500)
- Rate limiting with clear error messages
- Validation errors with field-level feedback

### UI/UX Features

**FR-UI-001: Responsive Design**
- Mobile-first approach
- Breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Touch-friendly interactive elements on mobile
- Adaptive layouts for different screen sizes

**FR-UI-002: Dark Mode**
- System dark mode support (follows OS preference)
- Manual toggle for user override
- Consistent dark mode palette across components
- Preference persisted in user settings

**FR-UI-003: Loading States**
- Skeleton loaders for async content
- Loading spinners for actions (button submits, etc.)
- Optimistic UI updates where appropriate
- Smooth transitions and animations

**FR-UI-004: Empty States**
- Helpful illustrations and messaging
- Clear call-to-action buttons
- Contextual guidance for first-time users

### SEO Foundations

**FR-SEO-001: Internationalization SEO (hreflang)**
- hreflang tags configured for all supported languages (en/hi/bn)
- Proper `alternates.languages` metadata in root layout
- Ensures search engines understand language variants of same content
- Prevents duplicate content penalties across language versions

**FR-SEO-002: Social Sharing (Open Graph)**
- Default Open Graph image (branded template placeholder)
- `openGraph` metadata configuration in key pages
- Twitter Card metadata support
- Template users can easily swap branding/images

**FR-SEO-003: Crawler Configuration**
- `robots.txt` blocking authenticated routes (`/dashboard`, `/admin`, `/api`)
- Proper indexing directives for public vs. private routes
- Sensible defaults that template users can customize

**FR-SEO-004: Dynamic Open Graph Images**
- Auto-generated OG images for shareable pages
- Template-based image generation (title, description, branding)
- Uses `@vercel/og` or similar edge-compatible library
- Default branded template included
- Customizable per-page or per-content-type
- Twitter Card large image support
- Cache headers for performance

### Go-To-Market Features

**FR-GTM-001: Referral/Share Widget**
- Reusable share component for user-generated content
- Share targets: Twitter/X, LinkedIn, Facebook, WhatsApp, copy link
- Generates shareable URL with optional referral tracking parameter
- Works with any user artifact (template users define what's shareable)
- Mobile-friendly share sheet (native share API where supported)

**FR-GTM-002: Private Shareable URLs**
- Generate unique, unguessable URLs for user-created content
- Access control: public, private (link-only), or authenticated
- Optional expiration for time-limited sharing
- View tracking (who accessed, when)
- Revoke/regenerate link capability
- Infrastructure pattern—template users implement for their specific artifacts

**FR-GTM-003: Changelog-to-Content Automation**
- GitHub Action triggered on tagged releases
- Reads conventional commit messages or changelog entries
- LLM transforms technical changelog into:
  - Tweet-length announcement (280 chars)
  - LinkedIn post (longer form, professional tone)
  - Short documentation entry (user-facing release notes)
- Creates PR for human review (default behavior)
- On PR merge: GitHub Action sends webhook to n8n instance
- n8n workflow schedules and publishes posts to Twitter/LinkedIn at configured time
- Template includes example n8n workflow JSON for import
- Configurable: LLM provider (OpenAI/Anthropic), tone, publish schedule
- Future enhancement: auto-commit option once confidence is established

**FR-GTM-004: Programmatic SEO Infrastructure**
- Page template system for generating many pages from data
- Data source: JSON file (e.g., `/data/seo-pages.json`)
- Dynamic route generation (`/[category]/[item]` pattern)
- SEO metadata generation per page (title, description, OG tags)
- Sitemap auto-generation including programmatic pages
- Example implementation with sample dataset
- Documentation for template users to add their own JSON data

**FR-GTM-005: Pre-Launch Landing Page**
- Dedicated route (e.g., `/coming-soon` or `/waitlist`)
- Interest capture form: email required, additional questions configurable
- Email stored in database with timestamp
- Success state with share prompt ("Tell your friends!")
- Redirect logic: main landing page redirects here if `PRE_LAUNCH=true` env var
- Simple admin view: list of signups, export to CSV
- Integrates with email system for confirmation/welcome

**FR-GTM-006: Social Proof Widgets**
- Static/hardcoded data (template users update values manually)
- "X people signed up" counter component
- Testimonial/quote display component
- Trust badges component (logos, certifications, stats)
- Easy to update via config file or component props
- No database queries, no real-time updates

### Example Integration (AI Chat)

**FR-CHAT-001: AI Chat Interface (Example Code)**
- Real-time streaming chat interface
- Server-Sent Events (SSE) for AI responses
- Conversation threading (persistent conversations)
- Message history
- **Note:** This is example code demonstrating patterns - template users can keep, customize, or remove

**FR-CHAT-002: Chat API Proxy**
- Secure API key management (server-side only)
- Proxy pattern for external AI services (Dify example)
- Streaming response handling
- Error recovery and retry logic

### Analytics & Instrumentation

**FR-ANALYTICS-001: Event Tracking**
- Track key user flows: sign-up, email verification, onboarding steps, first feature use
- Track critical user actions: profile updates, feedback submissions, admin operations
- Track errors and user friction points (failed form submissions, auth errors, etc.)
- Integration with analytics provider (PostHog, Amplitude, or similar - swappable/configurable)
- Privacy-respecting by default (GDPR/CCPA compliant event collection)
- Custom event tracking infrastructure easily extensible by template users

**FR-ANALYTICS-002: User Flow Instrumentation**
- Funnel tracking for onboarding completion rate
- Feature adoption metrics (which features are used, frequency)
- Session replay capability (optional, privacy-respecting, user opt-in)
- Conversion tracking for critical paths (sign-up → onboarded → active user)
- Performance monitoring integration (Core Web Vitals, error rates)
- Dashboard/reporting interface for viewing key metrics

**FR-ANALYTICS-003: Developer Experience**
- Simple utility functions for logging custom events (`trackEvent('feature_used', { feature: 'feedback' })`)
- TypeScript types for event schemas
- Development mode: log events to console instead of sending to provider
- Documentation and examples for common tracking patterns
- Easy to swap providers or disable completely

**FR-ANALYTICS-004: Founder Analytics Dashboard**
- Internal dashboard route (`/admin/analytics` or `/dashboard/analytics`)
- Data sourced from PostgreSQL (no external provider dependency)
- Key metrics displayed:
  - Total signups (all-time, this week, this month)
  - Activation rate (completed onboarding / total signups)
  - Referral metrics (signups via referral links, top referrers)
  - Pre-launch waitlist count (if applicable)
  - Conversion funnel visualization (signup → verified → onboarded → active)
- Simple time-range filter (7d, 30d, 90d, all-time)
- Export data as CSV
- Refreshes on page load (no real-time, keeps it simple)

## Non-Functional Requirements

### Performance

**NFR-PERF-001: Page Load Performance**
- First Contentful Paint < 1.5 seconds
- Time to Interactive < 3.5 seconds
- Lighthouse Performance score ≥ 90

**NFR-PERF-002: API Response Times**
- 95th percentile response time < 500ms for standard endpoints
- Database query optimization (proper indexes)
- Efficient caching strategies where applicable

**NFR-PERF-003: Bundle Size**
- Initial JavaScript bundle < 300KB gzipped
- Code splitting by route
- Dynamic imports for heavy components

### Scalability

**NFR-SCALE-001: Serverless Architecture**
- Auto-scaling serverless functions (Next.js API routes)
- No server management required
- Pay-per-use pricing model compatible

**NFR-SCALE-002: Database Design**
- Schema supports thousands of users without performance degradation
- Indexes on frequently queried columns
- Connection pooling configured (Supabase default)

### Security

**NFR-SEC-001: Authentication Security**
- Passwords hashed with bcrypt (handled by Supabase)
- HTTP-only cookies for session tokens
- CSRF protection enabled
- Rate limiting on auth endpoints

**NFR-SEC-002: Data Protection**
- All production traffic over HTTPS
- Environment variables never exposed to client
- Sensitive data (API keys, DB credentials) in secure storage
- SQL injection prevention (parameterized queries via ORM)

**NFR-SEC-003: Dependency Security**
- No high or critical vulnerabilities (`npm audit`)
- Regular dependency updates (quarterly)
- Automated security alerts via Dependabot

### Reliability

**NFR-REL-001: Error Recovery**
- Graceful degradation when external services fail
- Error boundaries prevent complete app crashes
- Retry logic for transient failures

**NFR-REL-002: Data Integrity**
- Database transactions where required
- Validation at API boundaries
- Type safety via TypeScript and Zod

### Maintainability

**NFR-MAINT-001: Code Quality**
- TypeScript strict mode enabled
- ESLint rules enforced
- Consistent code formatting (Prettier)
- Meaningful component and variable names

**NFR-MAINT-002: Documentation**
- Inline code comments for complex logic
- README with setup instructions
- Environment variable documentation
- Architecture decision records (ADRs) for key choices

**NFR-MAINT-003: Testing**
- Unit tests for critical utilities
- Example tests demonstrating testing patterns
- E2E tests for critical paths (auth, onboarding)

### Accessibility

**NFR-ACCESS-001: WCAG Compliance**
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all interactive elements
- Screen reader compatibility (ARIA labels)
- Sufficient color contrast ratios (4.5:1 for normal text)

**NFR-ACCESS-002: Assistive Technology Support**
- Semantic HTML structure
- Skip links for keyboard navigation
- Form labels properly associated
- Focus management in modals and dialogs

### Compatibility

**NFR-COMPAT-001: Browser Support**
- Modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions)
- Mobile browsers: iOS Safari, Chrome Android
- No IE11 support (modern stack only)

**NFR-COMPAT-002: Platform Support**
- Deployment-agnostic (Vercel recommended, but works on Netlify, Railway, etc.)
- Database-agnostic within PostgreSQL ecosystem
- Email provider swappable (Resend, SendGrid, etc.)

## Technical Requirements

### Frontend Stack

**TR-FE-001: Framework & Runtime**
- Next.js 15 with App Router
- React 19 with Server Components
- TypeScript 5.7+
- Node.js 20.x or 22.6+

**TR-FE-002: UI & Styling**
- Tailwind CSS 3.4+
- shadcn/ui component library
- Radix UI primitives for accessibility
- Class Variance Authority (CVA) for component variants

**TR-FE-003: State Management**
- React hooks and context for local state
- No opinionated global state library (users choose their own)
- URL state for shareable/bookmarkable views

### Backend Stack

**TR-BE-001: API Layer**
- Next.js API routes (serverless functions)
- RESTful API design patterns
- JSON request/response format
- Server Actions for form mutations

**TR-BE-002: Authentication**
- Supabase Auth V2
- SSR-compatible session management
- Cookie-based authentication

**TR-BE-003: Database**
- PostgreSQL (via Supabase or any provider)
- Drizzle ORM for type-safe queries
- Migration system (Drizzle Kit)

### Development Tools

**TR-DEV-001: Code Quality**
- ESLint (Antfu config)
- Prettier for formatting
- Husky for git hooks
- lint-staged for pre-commit checks

**TR-DEV-002: Testing**
- Vitest for unit tests
- Playwright for E2E tests
- Testing Library for component tests

**TR-DEV-003: Build Tools**
- Turbopack (Next.js 15 default)
- PostCSS for CSS processing
- SWC for fast compilation

### Infrastructure

**TR-INFRA-001: Deployment**
- Vercel (recommended, configured)
- Alternative: Netlify, Railway, Docker (documented)
- Edge network for middleware and SSR

**TR-INFRA-002: Monitoring & Error Tracking**
- Sentry for error tracking (configured)
- Vercel Analytics for performance monitoring
- User analytics provider (PostHog recommended, swappable)
- Custom event tracking infrastructure with TypeScript types
- Custom logging with structured format

**TR-INFRA-003: CI/CD**
- GitHub Actions workflows
- Automated testing on PR
- Automatic deployment on merge to main
- Environment-based configurations

## Constraints & Assumptions

### Technical Constraints

**TC-001: Modern Stack Only**
- No legacy browser support (IE11, old Safari)
- Requires JavaScript enabled
- Assumes modern build tooling available

**TC-002: Serverless Deployment**
- Designed for serverless platforms (Vercel, Netlify)
- No long-running processes or cron jobs (use external schedulers)
- Stateless API routes (no server-side session storage beyond cookies)

**TC-003: PostgreSQL Dependency**
- Database must be PostgreSQL-compatible
- Drizzle ORM requires PostgreSQL-specific features
- No NoSQL or multi-database support

### Business Constraints

**BC-001: Personal Use Template**
- No commercial licensing restrictions
- No dedicated support or SLAs
- Maintained by single developer (Varun)
- Community contributions via PRs welcome

**BC-002: Dependency on Third-Party Services**
- Supabase for auth and database (or compatible alternative)
- Email service (Resend, SendGrid, or SMTP)
- Deployment platform (Vercel recommended)

### Assumptions

**AS-001: User Technical Skill**
- Template users have intermediate to advanced Next.js knowledge
- Familiar with TypeScript, React, and modern web development
- Can navigate git, environment variables, and deployment platforms

**AS-002: Development Environment**
- Users have Node.js 20+ installed
- Git available for version control
- Modern code editor (VS Code recommended)
- Command line proficiency

**AS-003: External Service Access**
- Users can create accounts on Supabase, Vercel, GitHub
- API keys and credentials obtainable
- Credit card not required for initial deployment (free tiers sufficient)

## Success Criteria (Technical Validation)

### MVP Acceptance Criteria

**AC-001: Build & Deploy**
- ✅ `npm install` completes without errors
- ✅ `npm run dev` starts local server successfully
- ✅ `npm run build` produces production build with 0 errors
- ✅ Deployment to Vercel completes successfully
- ✅ Production site loads and is accessible via HTTPS

**AC-002: Authentication Flow**
- ✅ User can sign up with email/password
- ✅ Email verification link sent and functional
- ✅ User can sign in after verification
- ✅ Password reset flow works end-to-end (including all UI states)
- ✅ "Forgot password?" link visible on sign-in page
- ✅ Social auth buttons (Google, GitHub) visible and functional
- ✅ Email verification UI shows "resend" button with working functionality
- ✅ All auth forms show loading states during submission
- ✅ Error messages display clearly for failed auth attempts
- ✅ Protected routes redirect unauthenticated users
- ✅ Session persists across page refreshes

**AC-003: Core Features**
- ✅ Onboarding wizard displays after signup
- ✅ Username setting saves and persists
- ✅ Feedback widget submits to database
- ✅ Admin panel shows user list
- ✅ Language switcher changes UI language
- ✅ Dashboard displays with proper empty states

**AC-004: Quality Gates**
- ✅ ESLint passes with 0 errors
- ✅ TypeScript compiles with 0 errors
- ✅ `npm audit` shows 0 high/critical vulnerabilities
- ✅ Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- ✅ All 3 languages render without errors

**AC-005: CI/CD**
- ✅ GitHub Actions workflow runs on every push
- ✅ All checks pass (lint, types, tests, build)
- ✅ PR preview deployments generated automatically
- ✅ Merge to main triggers production deployment

---

**END OF PRD**

*Generated by BMAD PRD Workflow - VT SaaS Template Transformation*
*Date: 2026-01-05*
*Author: Varun (with PM Agent John)*
