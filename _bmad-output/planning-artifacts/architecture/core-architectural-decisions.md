# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**

These decisions were required before any implementation could proceed:

1. **Database & ORM**: PostgreSQL + Drizzle ORM (production-proven, already in use)
2. **Authentication Provider**: Supabase Auth V2 (SSR-compatible, already integrated)
3. **Frontend Framework**: Next.js 15 + React 19 (upgrading from 14/18)
4. **Deployment Platform**: Vercel serverless (already configured)
5. **Styling System**: Tailwind CSS + shadcn/ui (production-ready)

**Important Decisions (Shape Architecture):**

These decisions significantly impact development patterns:

6. **Schema Organization**: Per-project schemas (enables multi-project DB reuse)
7. **Analytics Provider**: PostHog (event tracking, conversion funnels, session replay)
8. **Email Service**: Resend (React Email native, simple API)
9. **Form Handling**: React Hook Form + Zod (consistent validation patterns)
10. **State Management**: Server Components + React hooks (minimal client-side state)
11. **API Documentation**: Manual markdown + JSDoc (maintainable, comprehensive)
12. **Testing Strategy**: Vitest + Playwright + Storybook (coverage at all levels)
13. **Branching Strategy**: Feature branches + Protected main (GitHub Flow with Vercel previews)

**Deferred Decisions (Post-MVP):**

These can be added later without architectural refactoring:

14. **Rate Limiting**: Defer to post-launch (document Upstash Redis pattern for future)
15. **Caching Strategy**: Defer (Supabase connection pooling sufficient initially)
16. **WebSocket/Realtime**: Defer (SSE streaming sufficient for chat example)
17. **Multi-region Deployment**: Defer (Vercel Edge handles global distribution)

---

## Data Architecture

**Database Choice: PostgreSQL via Supabase**

- **Version**: PostgreSQL 15+ (Supabase-hosted)
- **Rationale**: Production-proven, battle-tested with HealthCompanion. Supabase provides managed hosting, connection pooling, automatic backups. PostgreSQL required by Drizzle ORM's advanced features (array columns, JSONB, full-text search).
- **Affects**: All data persistence, API routes, background jobs
- **Trade-offs**: PostgreSQL-only (no multi-database), requires connection pooling (Supabase handles), more complex than MongoDB but better relational data handling
- **Provided by Starter**: Yes (existing HealthCompanion production setup)

**ORM: Drizzle ORM**

- **Version**: Latest stable (drizzle-orm@latest, drizzle-kit@latest)
- **Rationale**: Type-safe queries, automatic schema generation, migration system works well with PostgreSQL. Lighter than Prisma, better TypeScript inference, SQL-like syntax.
- **Affects**: All database interactions, schema definitions, migrations
- **Trade-offs**: Smaller ecosystem than Prisma, fewer third-party integrations, steeper learning curve than Mongoose
- **Migration Pattern**:
  ```bash
  # Schema changes in src/models/Schema.ts
  npm run db:generate  # Creates migration
  # Auto-applied on next DB query (or npm run db:migrate for Edge runtime)
  ```
- **Provided by Starter**: Yes (production-proven migration system)

**Schema Organization Strategy: Per-Project Schemas**

- **Pattern**: Each project uses dedicated PostgreSQL schema (not public schema)
- **Rationale**: Enables multi-project setup in single Supabase database. Logical isolation prevents table name collisions. Same connection string, different namespaces.
- **Current Implementation**:
  ```typescript
  // src/models/Schema.ts
  export const healthCompanionSchema = pgSchema('health_companion');
  export const threads = healthCompanionSchema.table('threads', { ... });
  ```
- **Template Pattern**:
  ```typescript
  // Template users will:
  // 1. Rename schema: vtSaasSchema = pgSchema('my_project_name')
  // 2. All tables automatically namespace under my_project_name.*
  ```
- **Affects**: Database organization, migration scripts, connection setup
- **Trade-offs**: Slightly more complex than public schema, but enables flexible multi-project reuse
- **Provided by Starter**: Yes (already implemented pattern in HealthCompanion)

**Data Validation: Zod Schemas**

- **Version**: zod@latest
- **Rationale**: Type-safe runtime validation, auto-generates TypeScript types, integrates with React Hook Form, reusable schemas across API and forms.
- **Pattern**:
  ```typescript
  // Validation schemas in API routes
  const createThreadSchema = z.object({
    conversationId: z.string().min(1),
    title: z.string().optional()
  });

  // Reuse in forms with React Hook Form resolver
  const form = useForm({ resolver: zodResolver(createThreadSchema) });
  ```
- **Affects**: All API input validation, form validation, type generation
- **Trade-offs**: Runtime overhead (minimal), extra dependency (11KB), but catches errors at API boundary
- **Provided by Starter**: Partially (used in API routes, pattern to be formalized)

**Caching Strategy: Deferred**

- **Decision**: No caching layer initially
- **Rationale**: Supabase connection pooling sufficient for template scale. Caching adds complexity (invalidation, consistency) without clear benefit at MVP stage.
- **Future Path**: If needed, add Upstash Redis for serverless-compatible caching (edge-compatible, HTTP-based)
- **Affects**: None initially (defer to post-launch optimization)
- **Documentation**: Add pattern guide in docs/ for adding Redis caching if performance requires

---

## Authentication & Security

**Authentication Provider: Supabase Auth V2**

- **Version**: @supabase/supabase-js@latest (Auth V2 APIs)
- **Rationale**: SSR-compatible (critical for Next.js App Router), cookie-based sessions work with edge middleware, managed service (no auth server to maintain), swappable (standard PostgreSQL + auth tables).
- **Pattern**: Three client factories for different contexts:
  ```typescript
  // Browser: createBrowserClient() - client components
  // Server: createClient(cookies) - server components, API routes
  // Middleware: createServerClient() - edge middleware session refresh
  ```
- **Affects**: All protected routes, API authentication, session management
- **Trade-offs**: Supabase-specific APIs (but swappable), managed service dependency, limited customization vs. custom auth
- **Provided by Starter**: Yes (production-proven SSR patterns)

**Authorization Pattern: Role-Based Access Control (Simple)**

- **Implementation**: Database flag (isAdmin boolean) or environment variable check
- **Rationale**: Simple admin check sufficient for template. Complex RBAC (permissions, roles) overkill for MVP.
- **Pattern**:
  ```typescript
  // Middleware: Protect admin routes
  if (pathname.startsWith('/admin')) {
    const isAdmin = user.user_metadata?.isAdmin || false;
    if (!isAdmin) {
      return redirect('/dashboard');
    }
  }
  ```
- **Affects**: Admin panel routes, admin API endpoints
- **Trade-offs**: Not fine-grained (can't do "user can edit post but not delete"), but extensible later
- **Provided by Starter**: Documented pattern (implementation part of FR-ADMIN epic)

**Security Middleware: Edge Runtime Session Validation**

- **Implementation**: `src/middleware.ts` validates session on every request
- **Flow**:
  1. i18n middleware (locale detection)
  2. Supabase session refresh (update cookies)
  3. Protected path check (require auth)
  4. Redirect if unauthorized
- **Rationale**: Edge runtime < 10ms latency, catches auth issues before route handler, refreshes sessions automatically (prevents expiry)
- **Affects**: All requests (public and protected)
- **Trade-offs**: Runs on every request (performance critical), edge runtime constraints (no Node.js APIs)
- **Provided by Starter**: Yes (production-proven orchestration)

**API Security: Session Validation + HTTPS-Only**

- **Pattern**: All API routes validate session:
  ```typescript
  const supabase = createClient(cookies());
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```
- **HTTPS Enforcement**: Vercel provides automatic HTTPS, middleware redirects HTTP to HTTPS in production
- **Environment Variables**: Server-side only (never exposed to client), validated at build time with Zod
- **Affects**: All API endpoints, client-side security
- **Trade-offs**: Boilerplate in every API route (could extract to helper), but explicit and clear
- **Provided by Starter**: Yes (pattern documented in existing API routes)

**Data Encryption: At-Rest & In-Transit**

- **At-Rest**: Supabase handles database encryption (AES-256)
- **In-Transit**: HTTPS/TLS for all connections (Vercel enforced)
- **Secrets Management**: Environment variables in Vercel (encrypted), never committed to Git
- **Rationale**: Managed services handle encryption, focus on application security (session validation, input validation)
- **Affects**: All data storage, all network communication
- **Provided by Starter**: Yes (Supabase + Vercel infrastructure)

**FR-AUTH-005: Authentication UI/UX (Tier 1)**

Complete authentication user experience with all necessary UI flows and states.

**Forgot/Reset Password Flow:**

- **Implementation**: Multi-step flow with Supabase Auth `resetPasswordForEmail`
- **Pages Required**:
  - `/sign-in` - "Forgot password?" link visible
  - `/forgot-password` - Email input form
  - `/reset-password` - New password form (accessed via email token)
- **Pattern**:
  ```typescript
  // Forgot password page
  'use client';
  import { createBrowserClient } from '@/libs/supabase/client';

  async function handleForgotPassword(email: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw error;
    }
    // Show success: "Check your email for reset link"
  }

  // Reset password page (with token)
  async function handleResetPassword(newPassword: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw error;
    }
    // Redirect to sign-in with success message
  }
  ```
- **Error Handling**:
  - Invalid/expired token → "This link has expired. Request a new one."
  - Rate limiting → "Too many requests. Please try again later."
- **Affects**: Auth pages, email templates
- **Provided by Starter**: Partial (Supabase configured, UI to be built)

**Social Authentication Buttons:**

- **Implementation**: OAuth buttons for Google and GitHub
- **Pattern**:
  ```typescript
  // Social auth component
  'use client';

  export function SocialAuthButtons({ mode }: { mode: 'sign-in' | 'sign-up' }) {
    const supabase = createBrowserClient();
    const [loading, setLoading] = useState<string | null>(null);

    const handleOAuth = async (provider: 'google' | 'github') => {
      setLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) {
        setLoading(null);
        toast.error(`Failed to ${mode} with ${provider}`);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={() => handleOAuth('google')}
          disabled={loading !== null}
        >
          {loading === 'google' ? <Spinner /> : <GoogleIcon />}
          Continue with Google
        </Button>
        <Button
          variant="outline"
          onClick={() => handleOAuth('github')}
          disabled={loading !== null}
        >
          {loading === 'github' ? <Spinner /> : <GitHubIcon />}
          Continue with GitHub
        </Button>
      </div>
    );
  }
  ```
- **Supabase Setup**: Configure OAuth providers in Supabase dashboard
- **Styling**: Consistent with template design system (shadcn/ui Button variants)
- **Affects**: Sign-in, sign-up pages
- **Provided by Starter**: No (to be added per FR-AUTH-005)

**Email Verification UI:**

- **Implementation**: Post-signup verification state handling
- **Pattern**:
  ```typescript
  // After signup - show verification prompt
  function VerificationPrompt({ email }: { email: string }) {
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleResend = async () => {
      setResending(true);
      const supabase = createBrowserClient();
      await supabase.auth.resend({ type: 'signup', email });
      setResending(false);
      setCooldown(60); // 60 second cooldown
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Verification success page (after clicking email link)
  // /verify-email?token_hash=xxx&type=signup
  ```
- **Blocked State**: If user tries to access protected routes without verification, show message with resend option
- **Affects**: Sign-up flow, protected route middleware
- **Provided by Starter**: No (to be added per FR-AUTH-005)

**Loading & Error States:**

- **Implementation**: Consistent UX patterns across all auth forms
- **Pattern**:
  ```typescript
  // Form submission with loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await authAction(data);
      toast.success('Success message');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button disabled during submission
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? <Spinner className="mr-2" /> : null}
    {isSubmitting ? 'Signing in...' : 'Sign in'}
  </Button>

  // Field-level validation errors (React Hook Form + Zod)
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage /> {/* Auto-displays Zod validation errors */}
      </FormItem>
    )}
  />
  ```
- **Toast Notifications**: Use shadcn/ui toast for success/error feedback
- **Network Error Recovery**: "Connection lost. Check your internet and try again."
- **Affects**: All auth forms
- **Provided by Starter**: Partial (toast configured, patterns to be applied consistently)

**Responsive Auth Design:**

- **Implementation**: Mobile-first auth forms
- **Pattern**:
  ```typescript
  // Auth page layout
  export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          {children}
        </Card>
      </div>
    );
  }

  // Form responsive considerations
  // - Touch-friendly button sizes (min-h-11 for mobile)
  // - Adequate spacing between form fields
  // - Input type="email" for mobile keyboard optimization
  // - Proper focus states for accessibility
  ```
- **Affects**: All auth pages on mobile/tablet/desktop
- **Provided by Starter**: Partial (layout exists, responsive polish to be added)

---

## API & Communication Patterns

**API Design: RESTful JSON APIs**

- **Pattern**: Standard REST endpoints, JSON request/response bodies, HTTP status codes
- **Current Endpoints**:
  - `POST /api/chat` - SSE streaming (special case)
  - `GET/POST /api/threads` - CRUD operations
  - `PATCH/DELETE /api/threads/[id]` - Resource-specific operations
- **Rationale**: Simple, well-understood, works with standard HTTP clients, no GraphQL complexity
- **Affects**: All API development, client-side data fetching
- **Trade-offs**: Over-fetching vs. GraphQL, multiple requests vs. single query, but simpler and more cacheable
- **Provided by Starter**: Yes (existing API patterns)

**Error Handling: Consistent Error Response Format**

- **Format**:
  ```typescript
  {
    error: "Human-readable message",
    code: "MACHINE_READABLE_CODE",
    details: {} // Optional (validation errors, debug info in dev)
  }
  ```
- **Standard Codes**: `AUTH_REQUIRED`, `INVALID_REQUEST`, `VALIDATION_ERROR`, `NOT_FOUND`, `DB_ERROR`, `INTERNAL_ERROR`
- **Rationale**: Consistent client-side error handling, machine-readable codes for conditional logic, debug details in development only
- **Affects**: All API routes, client-side error handling, monitoring
- **Trade-offs**: Boilerplate (return NextResponse.json pattern), but predictable and debuggable
- **Provided by Starter**: Yes (documented in api-contracts.md)

**API Documentation Strategy: Manual Markdown + JSDoc**

- **Decision**: Keep manual markdown docs (`docs/api-contracts.md`) as comprehensive reference
- **Enhancement**: Add JSDoc comments to API route handlers that reference Zod schemas
- **Pattern**:
  ```typescript
  /**
   * POST /api/threads - Create new thread
   * @body {conversationId: string, title?: string}
   * @returns {thread: Thread} 201 Created
   * @throws {AUTH_REQUIRED} 401 if not authenticated
   * @see docs/api-contracts.md for full specification
   */
  export async function POST(request: NextRequest) { ... }
  ```
- **Rationale**: Manual docs provide context and examples (excellent for template users learning patterns). JSDoc gives inline reference for developers. OpenAPI/Swagger overkill for template (tooling maintenance burden).
- **Affects**: Developer experience, onboarding new contributors, template user learning
- **Trade-offs**: Manual docs can drift from code (mitigated by code reviews), no interactive playground, but simple and maintainable
- **Provided by Starter**: Partial (manual docs exist, JSDoc pattern to be added)

**Rate Limiting: Deferred (Documented Pattern)**

- **Decision**: Not implemented in MVP
- **Rationale**: Template users have different rate limiting needs (public API vs. internal tool). Upstash Redis adds vendor dependency. Better to document pattern than enforce one approach.
- **Documented Pattern**:
  ```markdown
  ## Rate Limiting (Not Implemented - Add If Needed)

  **Recommended Approach:** Upstash Redis (serverless-compatible)

  **Pattern:**
  1. Install: @upstash/ratelimit + @upstash/redis
  2. Middleware wrapper: Check rate limit before handler
  3. Configuration: Sliding window (60 requests/minute per user)
  4. Response: 429 Too Many Requests with Retry-After header

  **Implementation:** See docs/adding-rate-limiting.md
  ```
- **Affects**: None initially (deferred to post-launch)
- **Future Path**: Add guide in docs/, example implementation in commented code
- **Provided by Starter**: No (documented as extension pattern)

**Real-Time Communication: SSE Streaming (Chat Example)**

- **Implementation**: Server-Sent Events for AI chat streaming (`/api/chat`)
- **Pattern**:
  ```typescript
  // API route returns text/event-stream
  const stream = new ReadableStream({ ... });
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
  ```
- **Rationale**: Unidirectional streaming (server → client) sufficient for chat. Simpler than WebSockets, works through HTTP, no connection management.
- **Affects**: AI chat feature (removable example code)
- **Trade-offs**: One-way only (no client → server push), not for collaborative editing, but perfect for streaming AI responses
- **Provided by Starter**: Yes (Dify chat example demonstrates pattern)

---

## Frontend Architecture

**Framework: Next.js 15 App Router + React 19**

- **Version**: Next.js 15.x, React 19.x (upgrading from 14/18)
- **Rationale**: App Router is future of Next.js (Pages Router maintenance mode). Server Components reduce bundle size. Streaming and suspense improve performance. Battle-tested in production.
- **Migration Path**:
  - Next.js 14 → 15: Async params/searchParams (await all param access)
  - React 18 → 19: New hooks, stricter rules (test all components)
- **Affects**: All pages, components, routing, data fetching
- **Trade-offs**: Learning curve (Server vs. Client Components), async params breaking change, but better performance and DX
- **Provided by Starter**: Yes (upgrade path documented)

**State Management: Server Components + React Hooks (Minimal)**

- **Pattern**: Favor Server Components for data fetching, use Client Components sparingly for interactivity
- **Client State**: React hooks (useState, useReducer) for local component state
- **Server State**: Fetch data in Server Components, pass as props, no global store
- **Form State**: React Hook Form (controlled state)
- **Rationale**: Server Components eliminate need for global state management (Redux, Zustand). Data fetching happens on server, no client-side cache complexity. Simpler mental model, smaller bundle.
- **Pattern**:
  ```typescript
  // Server Component (default)
  async function ThreadList() {
    const threads = await db.select().from(threadsTable); // Direct DB query
    return <ThreadListClient threads={threads} />;
  }

  // Client Component (minimal, only for interactivity)
  'use client';
  function ThreadListClient({ threads }) {
    const [filter, setFilter] = useState('all'); // Local state only
    return <div>...</div>;
  }
  ```
- **Affects**: Component architecture, data flow, bundle size
- **Trade-offs**: Can't use global state easily (but rarely needed), learning curve (when to use Server vs. Client), but simpler and more performant
- **Provided by Starter**: Yes (production pattern documented)

**Component Architecture: shadcn/ui + Feature Modules**

- **Base Components**: shadcn/ui (Radix UI primitives) in `src/components/ui/`
  - Copy-paste into codebase (not npm package)
  - Customizable styles (Tailwind + CSS variables)
  - Accessibility built-in (WCAG 2.1 AA)
- **Feature Components**: Organized by domain in `src/features/`
  - `features/auth/` - Sign-in, sign-up forms
  - `features/dashboard/` - Dashboard content
  - `features/feedback/` - Feedback widget
- **Layout Components**: Shells and navigation in `src/components/layout/`
- **Rationale**: shadcn/ui provides accessible primitives without lock-in (own the code). Feature modules group related components. Clear separation of concerns.
- **Affects**: Component development, styling, accessibility
- **Trade-offs**: Manual component updates (not npm dependency), but full control and customization
- **Provided by Starter**: Yes (38+ components already implemented)

**Routing Strategy: File-Based + Route Groups**

- **Pattern**: Next.js App Router file-based routing with route groups for organization
- **Structure**:
  ```
  app/[locale]/
  ├── (unauth)/        # Public routes (landing)
  ├── (auth)/          # Protected routes (dashboard, onboarding)
  ├── (chat)/          # Chat interface (removable, demonstrates layout)
  └── (admin)/         # Admin routes (to be added)
  ```
- **i18n**: Locale prefix (`/en/`, `/hi/`, `/bn/`) via next-intl middleware
- **Rationale**: Route groups organize related pages without affecting URL structure. File-based routing is Next.js convention. i18n middleware handles locale detection/fallback.
- **Affects**: URL structure, navigation, i18n, code organization
- **Trade-offs**: File-based routing less flexible than config-based (Remix), but convention over configuration
- **Provided by Starter**: Yes (production-proven structure)

**Form Handling: React Hook Form + Zod**

- **Version**: react-hook-form@latest, @hookform/resolvers@latest
- **Pattern**:
  ```typescript
  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' }
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    // Type-safe data, already validated
  }
  ```
- **Rationale**: React Hook Form is performant (uncontrolled inputs), integrates with Zod (reuse API validation schemas), good DX. Works for simple forms (feedback) and complex (multi-step onboarding).
- **Affects**: All forms (sign-in, sign-up, onboarding, feedback, admin)
- **Trade-offs**: 40KB bundle (but lazy-loadable), learning curve, but better DX than uncontrolled forms and more performant than Formik
- **Provided by Starter**: No (to be added, documented pattern)

**Performance Optimization: Code Splitting + Image Optimization**

- **Code Splitting**:
  - Automatic per-route (Next.js built-in)
  - Dynamic imports for heavy components:
    ```typescript
    const HeavyChart = dynamic(() => import('./HeavyChart'), {
      loading: () => <Skeleton />,
      ssr: false // Client-only if needed
    });
    ```
- **Image Optimization**: `next/image` for automatic optimization, WebP conversion, lazy loading
- **Font Optimization**: `next/font` for self-hosted fonts (Google Fonts via next/font/google)
- **Bundle Target**: < 300KB gzipped (enforced by bundle analyzer)
- **Rationale**: Performance budget enforces discipline. Lighthouse ≥ 90 target. Code splitting reduces initial load, image optimization reduces bandwidth.
- **Affects**: Build process, component development, image/font usage
- **Trade-offs**: Extra markup from next/image (styling complexity), but massive performance gains
- **Provided by Starter**: Yes (production-tuned configuration)

---

## Infrastructure & Deployment

**Hosting Platform: Vercel (Serverless)**

- **Rationale**: Built by Next.js creators (best Next.js support), automatic HTTPS, edge network (global CDN), preview deployments per PR, generous free tier, zero config.
- **Runtime**:
  - API routes: Node.js 20 (serverless functions)
  - Middleware: Edge runtime (global distribution, < 10ms cold start)
- **Scaling**: Automatic (request-based, no server management)
- **Affects**: All deployment, API latency, middleware execution, preview URLs
- **Trade-offs**: Vercel-specific features (but portable to Netlify/Railway with docs), 10s function timeout on free tier (60s on Pro)
- **Provided by Starter**: Yes (production deployment configured)

**CI/CD Pipeline: GitHub Actions + Protected Main Branch**

- **Branching Strategy**: Feature branches + Protected main (GitHub Flow)
  - `main` - Production (protected, requires PR + passing checks)
  - `feature/*` - Feature branches (work in progress, unprotected)
  - No staging branch - Vercel preview deployments serve as staging

- **Branch Protection Rules** (GitHub Settings → Branches → main):
  1. Require pull request before merging
  2. Require status checks to pass: lint, type-check, test, build
  3. Require approval before merge (even solo dev - forces conscious review)
  4. Automatically delete head branches after merge (keeps repo clean)

- **Workflows** (`.github/workflows/`):
  - `CI.yml`: On push/PR - lint, type-check, test, build
  - `release.yml`: On main - semantic versioning, changelog generation

- **Quality Gates**:
  1. ESLint (no errors allowed)
  2. TypeScript type check (strict mode)
  3. Vitest unit tests (must pass)
  4. Playwright E2E tests (critical paths)
  5. npm audit (no high/critical vulnerabilities)
  6. Build succeeds

- **Deployment Flow**:
  1. Create feature branch: `git checkout -b feature/add-onboarding`
  2. Commit changes: `git commit -m "feat: add onboarding wizard"`
  3. Push to GitHub: `git push origin feature/add-onboarding`
  4. Create PR → Triggers:
     - GitHub Actions CI (quality gates)
     - Vercel preview deployment (staging URL)
  5. Review code + test preview URL
  6. Merge PR → Automatic production deployment

- **Preview Deployments** (Vercel):
  - Every PR gets unique URL: `https://healthcompanion-git-{branch}-{username}.vercel.app`
  - Test changes in production-like environment before merge
  - Auto-deleted when PR closed/merged

- **Rationale**: Feature branches + protected main is GitHub Flow (industry standard). Vercel preview deployments eliminate need for staging branch - every PR IS a staging environment. Forces review before production, catches issues with CI gates, keeps main stable.

- **AI Agent Pattern**:
  1. Agent creates feature branch
  2. Agent implements changes, pushes commits
  3. Agent creates PR with detailed description
  4. Human reviews PR + tests preview URL
  5. Human merges (or requests changes)
  - This pattern prevents AI agents from breaking production directly

- **Affects**: Code quality, deployment safety, collaboration workflow
- **Trade-offs**: Extra step vs. direct push to main (but protection worth it), PR overhead for solo dev (but forces review discipline)
- **Provided by Starter**: Yes (GitHub Actions configured, branch protection to be documented)

**Environment Configuration: Vercel Environment Variables**

- **Structure**:
  - `.env.example` (committed, template for required vars)
  - `.env.local` (gitignored, local development secrets)
  - Vercel dashboard (production/preview environment vars)
- **Validation**: Zod schemas validate required env vars at build time
- **Pattern**:
  ```typescript
  // src/utils/env.ts
  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    DIFY_API_KEY: z.string().optional() // Optional for removable features
  });

  export const env = envSchema.parse(process.env); // Fails build if invalid
  ```
- **Rationale**: Build-time validation catches missing env vars before deployment. Clear distinction between public (NEXT_PUBLIC_*) and server-side secrets.
- **Affects**: Configuration management, deployment safety, secret handling
- **Trade-offs**: Zod validation adds build step, but prevents runtime failures
- **Provided by Starter**: Partial (pattern to be formalized)

**Monitoring & Logging: Sentry + Vercel Analytics**

- **Error Tracking**: Sentry (optional but configured)
  - Captures exceptions, breadcrumbs, user context
  - Development: Sentry Spotlight (local debugging UI)
  - Production: Cloud dashboard, Slack alerts
- **Performance Monitoring**: Vercel Analytics (automatic, no config)
  - Web Vitals (LCP, FID, CLS)
  - Function execution time
  - Error rates
- **Logging**: Structured logging with Pino
  - Development: Pretty-printed to console
  - Production: JSON logs (Vercel aggregates)
- **Rationale**: Sentry catches errors with context (stack traces, user actions). Vercel Analytics monitors performance. Pino provides structured logs for debugging.
- **Affects**: Debugging, incident response, performance monitoring
- **Trade-offs**: Sentry adds small bundle (error capture), but invaluable for debugging production issues
- **Provided by Starter**: Yes (Sentry configured, optional)

**Analytics: PostHog (Product Analytics)**

- **Version**: posthog-js@latest
- **Implementation**:
  ```typescript
  // src/libs/posthog/client.ts
  import posthog from 'posthog-js';

  // Initialize on client
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing();
        }
      }
    });
  }

  // Track events
  export const trackEvent = (event: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties);
      return;
    }
    posthog.capture(event, properties);
  };
  ```
- **Events to Track**:
  - Sign-up, sign-in, sign-out
  - Onboarding step completion
  - Feature usage (feedback submission, admin actions)
  - Error events (caught exceptions, API failures)
  - Conversion funnels (sign-up → onboarding → first action)
- **Privacy**: Opt-out in development, GDPR-compliant (PostHog has data controls)
- **Rationale**: Open-source, self-hostable (exit option), comprehensive features (events, funnels, session replay), generous free tier (1M events/month).
- **Affects**: All user flows, feature adoption tracking, conversion optimization
- **Trade-offs**: 20KB bundle for SDK, privacy considerations (mitigated with GDPR controls), but critical for understanding template user behavior
- **Provided by Starter**: No (to be added per FR-ANALYTICS)

**FR-ANALYTICS-004: Founder Analytics Dashboard**

Internal analytics dashboard powered by PostgreSQL - no external provider dependency for core metrics.

- **Implementation**: Server-side dashboard with direct database queries
- **Route**: `/admin/analytics` or `/dashboard/analytics` (protected)
- **Database Schema**:
  ```typescript
  // Analytics events table (optional, for detailed tracking)
  export const analyticsEvents = vtSaasSchema.table('analytics_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    event_type: text('event_type').notNull(), // 'signup', 'onboarding_complete', 'feature_used'
    user_id: uuid('user_id').references(() => users.id),
    properties: jsonb('properties'), // Additional event data
    created_at: timestamp('created_at').defaultNow(),
  });

  // User profiles table (extend existing)
  // Add: onboarding_completed_at, referral_source, activation_date
  ```
- **Metrics Implementation**:
  ```typescript
  // Server Component: app/[locale]/(auth)/admin/analytics/page.tsx
  import { db } from '@/libs/DB';
  import { sql } from 'drizzle-orm';

  export default async function AnalyticsDashboard() {
    // Total signups (all-time)
    const totalSignups = await db.execute(sql`
      SELECT COUNT(*) FROM auth.users
    `);

    // Signups by time range
    const signupsThisWeek = await db.execute(sql`
      SELECT COUNT(*) FROM auth.users
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // Activation rate (completed onboarding / total signups)
    const activationRate = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM user_profiles WHERE onboarding_completed_at IS NOT NULL)::float /
        NULLIF((SELECT COUNT(*) FROM auth.users), 0) * 100 as rate
    `);

    // Referral metrics
    const referralStats = await db.execute(sql`
      SELECT
        referral_source,
        COUNT(*) as count
      FROM user_profiles
      WHERE referral_source IS NOT NULL
      GROUP BY referral_source
      ORDER BY count DESC
      LIMIT 10
    `);

    // Conversion funnel
    const funnel = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM auth.users) as signed_up,
        (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as verified,
        (SELECT COUNT(*) FROM user_profiles WHERE onboarding_completed_at IS NOT NULL) as onboarded,
        (SELECT COUNT(*) FROM user_profiles WHERE last_active_at > NOW() - INTERVAL '7 days') as active
    `);

    return (
      <div className="space-y-6">
        <h1>Founder Analytics</h1>
        <TimeRangeFilter options={['7d', '30d', '90d', 'all-time']} />

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="Total Signups" value={totalSignups} />
          <MetricCard title="This Week" value={signupsThisWeek} />
          <MetricCard title="Activation Rate" value={`${activationRate}%`} />
          <MetricCard title="Waitlist" value={waitlistCount} />
        </div>

        {/* Conversion Funnel */}
        <FunnelChart data={funnel} />

        {/* Top Referrers */}
        <ReferralTable data={referralStats} />

        {/* Export Button */}
        <ExportCSVButton />
      </div>
    );
  }
  ```
- **Time Range Filter**:
  ```typescript
  // URL-based state: /admin/analytics?range=30d
  const ranges = {
    '7d': 'NOW() - INTERVAL \'7 days\'',
    '30d': 'NOW() - INTERVAL \'30 days\'',
    '90d': 'NOW() - INTERVAL \'90 days\'',
    'all-time': '\'1970-01-01\'::timestamp',
  };
  ```
- **CSV Export**:
  ```typescript
  // API route: GET /api/admin/analytics/export
  export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const data = await getAnalyticsData(range);
    const csv = convertToCSV(data);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${range}.csv"`,
      },
    });
  }
  ```
- **Key Metrics Displayed**:
  - Total signups (all-time, this week, this month)
  - Activation rate (onboarding completed / signups)
  - Referral metrics (signups via referral links, top referrers)
  - Pre-launch waitlist count (if applicable)
  - Conversion funnel visualization
- **Design Principles**:
  - Refreshes on page load (no real-time, keeps implementation simple)
  - Server-side queries only (no client-side data fetching)
  - Mobile-responsive dashboard layout
- **Affects**: Admin functionality, founder insights
- **Trade-offs**: No real-time updates, but avoids complexity of WebSocket/polling
- **Provided by Starter**: No (to be added per FR-ANALYTICS-004)

**Email Service: Resend**

- **Version**: resend@latest, react-email@latest
- **Implementation**:
  ```typescript
  // src/libs/email/client.ts
  import { Resend } from 'resend';

  import WelcomeEmail from '@/emails/WelcomeEmail';

  const resend = new Resend(process.env.RESEND_API_KEY);

  export async function sendWelcomeEmail(to: string, name: string) {
    return await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to,
      subject: 'Welcome to VT SaaS Template',
      react: WelcomeEmail({ name })
    });
  }
  ```
- **Templates**: React Email components in `emails/` directory
  - WelcomeEmail.tsx - Sign-up confirmation
  - ResetPasswordEmail.tsx - Password reset link
  - VerifyEmail.tsx - Email verification
- **Abstraction Layer**: Email service interface for swappability
  ```typescript
  type EmailService = {
    send: (params: EmailParams) => Promise<EmailResult>;
  };

  // Easy to swap Resend for SendGrid/SES later
  const emailService: EmailService = new ResendService();
  ```
- **Rationale**: Resend built for React Email (native support), simple API, 3k free emails/month, swappable via abstraction layer (zero vendor lock-in).
- **Affects**: Authentication flows (verification, password reset), user notifications
- **Trade-offs**: Resend is young (less mature than SendGrid), limited geographic regions, but best DX for React templates
- **Provided by Starter**: No (to be added per FR-EMAIL)

**Scaling Strategy: Serverless Auto-Scaling**

- **Approach**: Vercel serverless functions auto-scale per request
- **No Manual Scaling**: No servers to manage, no capacity planning
- **Database**: Supabase connection pooling handles concurrent connections
- **Limits**:
  - Free tier: 100GB bandwidth, 100 serverless function executions/hour
  - Pro tier: Unlimited bandwidth, 1000 executions/hour
- **Rationale**: Serverless removes scaling complexity. Supabase handles database connections. Works well for template users (most won't hit limits initially).
- **Affects**: Cost structure, deployment complexity (none), performance at scale
- **Trade-offs**: Cold start latency (mitigated by edge runtime for middleware), function timeout (10s free, 60s Pro), but zero ops burden
- **Provided by Starter**: Yes (Vercel deployment configured)

---

## SEO Foundations

**SEO Strategy: Next.js Metadata API + Edge-Compatible OG Generation**

VT SaaS Template provides essential SEO infrastructure out of the box, enabling template users to rank well without extensive configuration.

**FR-SEO-001: Internationalization SEO (hreflang)**

- **Implementation**: Next.js `generateMetadata` with `alternates.languages`
- **Pattern**:
  ```typescript
  // app/[locale]/layout.tsx
  export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
      alternates: {
        languages: {
          en: '/en',
          hi: '/hi',
          bn: '/bn',
        },
        canonical: `/${locale}`,
      },
    };
  }
  ```
- **Rationale**: Prevents duplicate content penalties across language versions. Helps search engines serve correct language version to users.
- **Affects**: All pages, root layout metadata
- **Provided by Starter**: Partial (next-intl configured, hreflang to be added)

**FR-SEO-002: Social Sharing (Open Graph)**

- **Implementation**: Next.js Metadata API with Open Graph and Twitter Card support
- **Pattern**:
  ```typescript
  // Default OG metadata in root layout
  export const metadata: Metadata = {
    metadataBase: new URL('https://yourdomain.com'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'VT SaaS Template',
      images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@yourhandle',
    },
  };
  ```
- **Rationale**: Social sharing drives organic growth. Consistent branding across platforms.
- **Affects**: All shareable pages, social media previews
- **Trade-offs**: Default OG image needs to be created by template user (placeholder provided)
- **Provided by Starter**: No (to be added per FR-SEO-002)

**FR-SEO-003: Crawler Configuration (robots.txt)**

- **Implementation**: Static `robots.txt` in `/public` directory
- **Pattern**:
  ```txt
  # /public/robots.txt
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /dashboard
  Disallow: /admin
  Disallow: /onboarding
  Disallow: /chat

  Sitemap: https://yourdomain.com/sitemap.xml
  ```
- **Rationale**: Prevents crawling of authenticated routes (reduces crawl budget waste, prevents indexing of user-specific content).
- **Affects**: Search engine crawling behavior
- **Provided by Starter**: No (to be added per FR-SEO-003)

**FR-SEO-004: Dynamic Open Graph Images**

- **Implementation**: `@vercel/og` for edge-compatible image generation
- **Pattern**:
  ```typescript
  // app/api/og/route.tsx
  import { ImageResponse } from '@vercel/og';

  export const runtime = 'edge';

  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'VT SaaS Template';

    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 60 }}>
          <div style={{ color: 'white', fontSize: 60, fontWeight: 'bold' }}>{title}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 30, marginTop: 20 }}>VT SaaS Template</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
  ```
- **Usage in Pages**:
  ```typescript
  export async function generateMetadata({ params }) {
    const title = 'Page Title';
    return {
      openGraph: {
        images: [`/api/og?title=${encodeURIComponent(title)}`],
      },
    };
  }
  ```
- **Rationale**: Dynamic OG images improve click-through rates on social media. Edge runtime ensures fast generation globally.
- **Affects**: Social sharing, link previews, SEO for shareable content
- **Trade-offs**: Adds API route, requires font embedding for custom fonts (or use system fonts)
- **Provided by Starter**: No (to be added per FR-SEO-004)

**Sitemap Generation:**

- **Implementation**: Next.js `sitemap.ts` in app directory
- **Pattern**:
  ```typescript
  // app/sitemap.ts
  import { MetadataRoute } from 'next';

  export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://yourdomain.com';
    const locales = ['en', 'hi', 'bn'];

    const staticPages = ['', '/features', '/pricing'];

    return locales.flatMap(locale =>
      staticPages.map(page => ({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: page === '' ? 1 : 0.8,
      }))
    );
  }
  ```
- **Affects**: Search engine discovery, indexing efficiency
- **Provided by Starter**: No (to be added with SEO foundations)

---

## Go-To-Market Infrastructure

**GTM Strategy: Built-in Growth Features for SaaS Launch**

VT SaaS Template includes essential go-to-market infrastructure to help template users launch and grow their SaaS products without building common growth features from scratch.

**FR-GTM-001: Referral/Share Widget**

- **Implementation**: Reusable share component with native share API fallback
- **Pattern**:
  ```typescript
  // src/components/share/ShareWidget.tsx
  'use client';

  interface ShareWidgetProps {
    url: string;
    title: string;
    text?: string;
    referralCode?: string;
  }

  export function ShareWidget({ url, title, text, referralCode }: ShareWidgetProps) {
    const shareUrl = referralCode ? `${url}?ref=${referralCode}` : url;

    const handleNativeShare = async () => {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      }
    };

    return (
      <div className="flex gap-2">
        {/* Social buttons: Twitter, LinkedIn, Facebook, WhatsApp */}
        <Button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`)}>
          Twitter
        </Button>
        {/* Copy link button */}
        <Button onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy Link</Button>
        {/* Native share (mobile) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <Button onClick={handleNativeShare}>Share</Button>
        )}
      </div>
    );
  }
  ```
- **Database Schema** (optional referral tracking):
  ```typescript
  // src/models/Schema.ts - add to schema
  export const referrals = vtSaasSchema.table('referrals', {
    id: uuid('id').primaryKey().defaultRandom(),
    referrer_id: uuid('referrer_id').references(() => users.id),
    referred_id: uuid('referred_id').references(() => users.id),
    referral_code: text('referral_code').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  });
  ```
- **Affects**: User growth, viral loops, content sharing
- **Trade-offs**: Referral tracking requires database schema addition (optional)
- **Provided by Starter**: No (to be added per FR-GTM-001)

**FR-GTM-002: Private Shareable URLs**

- **Implementation**: Unique token-based URL generation with access control
- **Pattern**:
  ```typescript
  // Database schema for shareable links
  export const shareableLinks = vtSaasSchema.table('shareable_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    token: text('token').notNull().unique(), // Unguessable token
    resource_type: text('resource_type').notNull(), // 'report', 'dashboard', etc.
    resource_id: uuid('resource_id').notNull(),
    owner_id: uuid('owner_id').references(() => users.id),
    access_level: text('access_level').notNull().default('view'), // 'view', 'edit'
    expires_at: timestamp('expires_at'), // Optional expiration
    view_count: integer('view_count').default(0),
    created_at: timestamp('created_at').defaultNow(),
  });

  // API route: POST /api/share
  // Generates: https://app.com/share/{token}
  ```
- **Access Control Patterns**:
  - `public`: Anyone with link can view
  - `authenticated`: Must be logged in
  - `private`: Link-only access (no auth required, but link is secret)
- **Affects**: Content sharing, collaboration features
- **Trade-offs**: Adds complexity, but pattern is reusable across any shareable content type
- **Provided by Starter**: No (to be added per FR-GTM-002)

**FR-GTM-003: Changelog-to-Content Automation**

- **Implementation**: GitHub Action + LLM transformation + n8n webhook
- **Architecture**:
  ```
  Tagged Release → GitHub Action
    → Read CHANGELOG.md or commit messages
    → Send to LLM API (OpenAI/Anthropic)
    → Generate: Tweet, LinkedIn post, Release notes
    → Create PR with generated content
    → On PR merge: Webhook to n8n
    → n8n schedules/publishes to social platforms
  ```
- **GitHub Action Pattern**:
  ```yaml
  # .github/workflows/release-content.yml
  name: Generate Release Content
  on:
    release:
      types: [published]
  jobs:
    generate:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Generate social content
          env:
            OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          run: |
            # Script to read release notes and generate content
            node scripts/generate-release-content.js
        - name: Create PR with content
          uses: peter-evans/create-pull-request@v5
          with:
            title: 'docs: release content for ${{ github.event.release.tag_name }}'
            body: Auto-generated social content for review
  ```
- **n8n Workflow**: Example workflow JSON provided in `docs/n8n-release-workflow.json`
- **Affects**: Marketing automation, content creation, release announcements
- **Trade-offs**: Requires LLM API key, n8n instance (self-hosted or cloud)
- **Provided by Starter**: No (to be added per FR-GTM-003, example workflow provided)

**FR-GTM-004: Programmatic SEO Infrastructure**

- **Implementation**: Dynamic route generation from JSON data source
- **Pattern**:
  ```typescript
  // data/seo-pages.json
  {
    "categories": [
      {
        "slug": "tools",
        "title": "SaaS Tools",
        "items": [
          { "slug": "analytics", "title": "Analytics Tools", "description": "..." },
          { "slug": "crm", "title": "CRM Tools", "description": "..." }
        ]
      }
    ]
  }

  // app/[locale]/[category]/[item]/page.tsx
  import seoData from '@/data/seo-pages.json';

  export async function generateStaticParams() {
    return seoData.categories.flatMap(cat =>
      cat.items.map(item => ({
        category: cat.slug,
        item: item.slug,
      }))
    );
  }

  export async function generateMetadata({ params }) {
    const { category, item } = await params;
    const data = findItem(category, item);
    return {
      title: data.title,
      description: data.description,
      openGraph: { images: [`/api/og?title=${encodeURIComponent(data.title)}`] },
    };
  }
  ```
- **Sitemap Integration**: Auto-include programmatic pages in `sitemap.ts`
- **Affects**: SEO traffic, long-tail keyword targeting, content scaling
- **Trade-offs**: Requires content strategy, JSON data maintenance
- **Provided by Starter**: No (to be added per FR-GTM-004, example implementation provided)

**FR-GTM-005: Pre-Launch Landing Page**

- **Implementation**: Dedicated waitlist route with email capture
- **Pattern**:
  ```typescript
  // Database schema
  export const waitlist = vtSaasSchema.table('waitlist', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    source: text('source'), // utm_source tracking
    created_at: timestamp('created_at').defaultNow(),
  });

  // app/[locale]/waitlist/page.tsx
  // - Email capture form
  // - Success state with share prompt
  // - Social proof counter

  // Redirect logic in middleware
  if (process.env.PRE_LAUNCH === 'true' && pathname === '/') {
    return NextResponse.redirect(new URL('/waitlist', request.url));
  }
  ```
- **Admin View**: `/admin/waitlist` - list signups, export CSV
- **Email Integration**: Send confirmation email on signup via Resend
- **Affects**: Pre-launch marketing, audience building
- **Trade-offs**: Requires `PRE_LAUNCH` env var management
- **Provided by Starter**: No (to be added per FR-GTM-005)

**FR-GTM-006: Social Proof Widgets**

- **Implementation**: Static/configurable components for trust signals
- **Pattern**:
  ```typescript
  // src/components/social-proof/SignupCounter.tsx
  interface SignupCounterProps {
    count: number; // Hardcoded or from config
    label?: string;
  }

  export function SignupCounter({ count, label = 'people signed up' }: SignupCounterProps) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{count.toLocaleString()} {label}</span>
      </div>
    );
  }

  // src/components/social-proof/Testimonial.tsx
  // src/components/social-proof/TrustBadges.tsx
  ```
- **Configuration**: Update via component props or config file (no database queries)
- **Affects**: Conversion rates, trust building
- **Trade-offs**: Manual updates required (intentionally simple)
- **Provided by Starter**: No (to be added per FR-GTM-006)

---

## Decision Impact Analysis

**Implementation Sequence:**

These decisions must be implemented in this order to avoid rework:

1. **Database Schema Refactoring** (if needed - already using per-project schema pattern)
   - Ensure all tables use project-specific schema namespace
   - Document schema naming convention for template users

2. **Dependency Upgrades** (Next.js 15, React 19, latest Supabase SDK)
   - Test suite must pass after each upgrade
   - Update types and fix breaking changes
   - Document migration steps for template users

3. **Form Handling Pattern** (React Hook Form + Zod)
   - Add react-hook-form + @hookform/resolvers
   - Create example form (onboarding step 1) demonstrating pattern
   - Document form validation approach in architecture

4. **Email System** (Resend + React Email)
   - Add resend + react-email dependencies
   - Create email templates (Welcome, PasswordReset, Verification)
   - Implement abstraction layer for swappability
   - Connect to auth flows (Supabase triggers)

5. **Analytics Integration** (PostHog)
   - Add posthog-js dependency
   - Create trackEvent wrapper with dev/prod toggling
   - Instrument key user flows (sign-up, onboarding, feature usage)
   - Add privacy controls (GDPR opt-out)

6. **API Documentation Enhancement** (JSDoc comments)
   - Add JSDoc to all API route handlers
   - Reference Zod schemas in comments
   - Link to comprehensive docs/api-contracts.md

7. **Environment Variable Validation** (Zod schemas)
   - Create env.ts with Zod validation
   - Validate at build time (fail fast if missing)
   - Document all required env vars in .env.example

8. **Branch Protection Setup** (GitHub repository settings)
   - Configure main branch protection rules
   - Require PR reviews, passing CI checks
   - Enable auto-delete of merged branches

**Cross-Component Dependencies:**

1. **Form Handling ↔ API Validation**
   - Zod schemas shared between React Hook Form (client) and API routes (server)
   - Single source of truth for validation rules
   - Changes to schema affect both frontend and backend

2. **Analytics ↔ All User Flows**
   - trackEvent calls sprinkled throughout application
   - Privacy toggle affects all tracking
   - Adding new feature requires instrumentation

3. **Email ↔ Authentication**
   - Supabase Auth triggers send emails (welcome, verification, password reset)
   - Email service must be configured for auth flows to work
   - Template users must provide SMTP/Resend credentials

4. **Database Schema ↔ Migrations**
   - Schema changes require migration generation (npm run db:generate)
   - Drizzle ORM types auto-update based on schema
   - Breaking schema changes require data migration planning

5. **Environment Variables ↔ All External Services**
   - Supabase, Resend, PostHog, Sentry all require API keys
   - Missing env vars caught at build time (Zod validation)
   - Template users must configure all services for full functionality

6. **Middleware ↔ Authentication ↔ i18n**
   - Execution order matters: i18n → session refresh → auth check
   - Breaking middleware breaks entire app (no pages load)
   - Changes to middleware require careful testing

7. **Styling System ↔ Theme Customization**
   - CSS variables in globals.css define theme
   - Tailwind config references CSS variables
   - Component styles use semantic tokens (bg-primary, text-foreground)
   - 2-hour rebrand achieved by updating tailwind.config.ts + globals.css only

8. **Branching Strategy ↔ Deployment Pipeline**
   - Feature branches trigger PR preview deployments (Vercel)
   - Main branch merges trigger production deployments
   - Protected main prevents direct pushes (forces PR workflow)
   - CI gates block merges if quality checks fail
