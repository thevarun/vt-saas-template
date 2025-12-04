# HealthCompanion - Epic Breakdown

**Date:** 2025-12-01
**Project Level:** Quick Flow (5 stories)

---

## Epic 1: AI-Powered Health Coach SaaS MVP

**Slug:** ai-health-coach

### Goal

Create a functional AI-powered health coaching SaaS application that digitizes expert health coach knowledge into an always-available, interactive platform. Enable users to receive personalized health guidance through an intelligent chat interface backed by the health coach's proven methodologies and frameworks.

**Business Value:** Scale health coach expertise beyond 1-on-1 sessions, provide 24/7 access to health guidance, create new revenue stream through SaaS subscription model.

### Scope

**In Scope:**
- User authentication and session management via Supabase
- AI-powered chat interface with health coach persona
- Knowledge base integration powered by Dify Cloud
- User-triggered workflows for common health coaching activities
- Responsive web application (desktop, tablet, mobile browsers)
- Secure backend proxy for AI orchestration
- Basic user profiles and preferences storage

**Out of Scope:**
- Journal/diary functionality
- Mobile native apps (iOS, Android)
- Progress tracking dashboards
- Payment processing beyond basic setup
- Multi-language support (English only for MVP)
- Admin dashboard for health coach
- Advanced personalization and analytics

### Success Criteria

1. ✅ **Users can create accounts and authenticate securely** - Sign up, email verification, sign in, session persistence working
2. ✅ **Users can have AI-powered health conversations** - Chat interface functional, AI responses stream in real-time within 2 seconds
3. ✅ **AI responses reflect health coach expertise** - Knowledge base populated, responses grounded in health coach methodology
4. ✅ **Users can trigger predefined workflows** - Workflow menu visible, workflows execute successfully and return results
5. ✅ **Conversations persist across sessions** - Chat history stored in Dify, loads on return visits
6. ✅ **Application is secure** - All API endpoints require authentication, Dify API keys protected server-side
7. ✅ **Application is responsive** - UI works on mobile, tablet, desktop with appropriate layouts

### Dependencies

**External Services:**
- Supabase Cloud (free tier) - Auth + PostgreSQL database
- Dify Cloud (free tier) - AI orchestration, knowledge base, workflows
- Vercel (free tier) - Hosting and deployment
- GitHub - Source control

**Technical Prerequisites:**
- SaaS Boilerplate (Next.js 14) cloned and set up
- Node.js 20.x LTS installed locally
- Docker Desktop for local database
- Health coach content prepared for knowledge base upload

**No Internal Dependencies:** This is a greenfield MVP with no existing systems to integrate.

---

## Story Map - Epic 1

```
Epic: AI-Powered Health Coach SaaS MVP (14 points total)
│
├── Story 1.1: Replace Clerk with Supabase Auth (3 points)
│   Dependencies: None (foundation story)
│   Deliverable: User authentication fully functional with Supabase
│
├── Story 1.2: Build Dify Backend Proxy (2 points)
│   Dependencies: Story 1.1 (requires auth to validate sessions)
│   Deliverable: Secure API proxy to Dify with session validation
│
├── Story 1.3: Create Chat Interface with Assistant-UI (3 points)
│   Dependencies: Stories 1.1, 1.2 (requires auth + proxy)
│   Deliverable: Functional chat UI integrated with backend
│
├── Story 1.4: Set Up Dify Knowledge Base (3 points)
│   Dependencies: Story 1.2 (Dify proxy must exist)
│   Deliverable: Knowledge base loaded, AI responds with health coach expertise
│
└── Story 1.5: Implement User Workflows (3 points)
    Dependencies: Stories 1.2, 1.3 (requires proxy + chat UI)
    Deliverable: Workflow menu functional, workflows execute and display results
```

**Sequence Validation:** ✅ Valid - Each story only depends on earlier stories

---

## Stories - Epic 1

### Story 1.1: Replace Clerk with Supabase Auth

As a developer,
I want to replace Clerk authentication with Supabase Auth,
So that we have a unified auth + database + vector DB stack for the MVP.

**Acceptance Criteria:**

AC #1: User can sign up with email/password via Supabase Auth
AC #2: User receives verification email and can verify account
AC #3: User can sign in with verified credentials
AC #4: User can sign out and session is properly cleared
AC #5: Protected routes redirect to sign-in page when user is not authenticated
AC #6: Session persists across page refreshes
AC #7: All Clerk dependencies removed from codebase
AC #8: All existing E2E auth tests pass with Supabase

**Prerequisites:** SaaS boilerplate cloned, Supabase project created

**Technical Notes:** Replace Clerk's middleware, hooks, and auth pages with Supabase equivalents using @supabase/ssr package for Next.js 14 App Router. Update 15-20 files total.

**Estimated Effort:** 3 story points (2-3 days)

---

### Story 1.2: Build Dify Backend Proxy

As a developer,
I want a secure backend proxy for the Dify API,
So that API keys remain server-side and user sessions are validated before AI requests.

**Acceptance Criteria:**

AC #1: /api/chat endpoint validates Supabase session before proxying requests
AC #2: Unauthorized requests return 401 with appropriate error message
AC #3: Valid requests successfully proxy to Dify API
AC #4: Streaming responses (SSE) work correctly from Dify through proxy to client
AC #5: Dify API errors are caught and returned as appropriate HTTP responses
AC #6: Dify API key is never exposed to client-side code
AC #7: Integration tests pass for chat API route

**Prerequisites:** Story 1.1 completed (Supabase auth functional)

**Technical Notes:** Create Dify client wrapper and API route using dify-client package. Implement session validation using Supabase SSR client.

**Estimated Effort:** 2 story points (1-2 days)

---

### Story 1.3: Create Chat Interface with Assistant-UI

As a user,
I want an intuitive chat interface,
So that I can easily interact with the AI health coach.

**Acceptance Criteria:**

AC #1: Chat interface loads without errors for authenticated users
AC #2: User can type messages and click send button
AC #3: Messages display in chronological order (user right, AI left)
AC #4: AI responses stream in real-time with typing indicator
AC #5: Loading states display during response generation
AC #6: Error messages display clearly when requests fail
AC #7: UI is fully responsive on mobile (< 768px), tablet (768-1024px), and desktop (> 1024px)
AC #8: Chat input field auto-focuses on page load
AC #9: Enter key sends message, Shift+Enter adds new line
AC #10: E2E tests pass for complete chat flow

**Prerequisites:** Stories 1.1, 1.2 completed (auth + proxy functional)

**Technical Notes:** Use Assistant-UI's Thread component integrated with /api/chat endpoint. Style with Tailwind CSS following boilerplate patterns.

**Estimated Effort:** 3 story points (2-3 days)

---

### Story 1.4: Set Up Dify Knowledge Base

As a health coach,
I want the AI to be trained on my expertise,
So that users receive accurate guidance based on my proven methodologies.

**Acceptance Criteria:**

AC #1: Health coach content uploaded to Dify knowledge base
AC #2: Content is properly chunked and embedded in Dify
AC #3: Test queries retrieve relevant information from knowledge base
AC #4: AI responses cite health coach methodology and frameworks
AC #5: Knowledge base is searchable and retrieves context correctly
AC #6: Agent persona configured to sound like health coach
AC #7: Sample health questions return appropriate, expert-level responses

**Prerequisites:** Story 1.2 completed (Dify proxy functional)

**Technical Notes:** Content upload and configuration happens in Dify dashboard UI (no code changes). Test via Dify playground before integrating with app.

**Estimated Effort:** 3 story points (2-3 days, mostly content preparation and testing)

---

### Story 1.5: Implement User Workflows

As a user,
I want to trigger specific health coaching workflows,
So that I can get structured guidance for common health goals.

**Acceptance Criteria:**

AC #1: Workflow menu button is visible in chat interface
AC #2: Clicking workflow menu displays available workflows
AC #3: Each workflow can be triggered by user selection
AC #4: Workflow parameters are collected correctly (if workflow requires inputs)
AC #5: Workflow executes and returns structured results
AC #6: Workflow results display in chat as formatted messages
AC #7: Workflow execution errors are caught and display user-friendly messages
AC #8: At least 2-3 workflows are functional (e.g., Goal Setting, Nutrition Planning)

**Prerequisites:** Stories 1.2, 1.3 completed (proxy + chat UI functional)

**Technical Notes:** Create /api/chat/workflows endpoint and WorkflowMenu component. Workflows are defined in Dify workflow builder (no-code).

**Estimated Effort:** 3 story points (2-3 days)

---

## Implementation Timeline - Epic 1

**Total Story Points:** 14 points

**Estimated Timeline:** 2-3 weeks (assuming 1-2 points per day, single developer)

**Implementation Sequence:**
1. Week 1: Stories 1.1, 1.2 (Foundation: Auth + Backend)
2. Week 2: Stories 1.3, 1.4 (UI + Intelligence)
3. Week 3: Story 1.5 + Testing + Polish (Workflows + Final QA)

**Critical Path:** Story 1.1 → Story 1.2 → Story 1.3 (core functionality)

**Parallel Work Opportunities:**
- Story 1.4 (Knowledge Base) can be prepared in parallel with Story 1.3
- Story 1.5 workflow design can happen alongside earlier stories

**Tech-Spec Reference:** See [tech-spec.md](./tech-spec.md) for complete implementation details, architecture decisions, and developer resources.
