# Project Overview

**Generated:** 2026-02-23 | **Version:** 1.8.0 | **Updated:** Rescan (quick)
**Type:** Full-stack Next.js Web Application (Monolith)

---

## What is VT SaaS Template?

A production-ready foundation for building SaaS web applications, designed for a solo developer who prioritizes productivity and efficiency. It provides authentication, AI chat, admin panel, analytics, email, and all the infrastructure needed to ship a SaaS product.

---

## Key Features

| Feature | Technology |
|---------|-----------|
| Authentication | Supabase (email, social OAuth, magic link) |
| AI Chat (Option 1) | Dify + Assistant UI (managed, minimal setup) |
| AI Chat (Option 2) | Vercel AI SDK + OpenAI/Anthropic (full control) |
| Admin Panel | User management, analytics, audit log, feedback |
| Email | Resend + React Email templates |
| Analytics | PostHog (type-safe events, funnels) |
| i18n | next-intl (English, Hindi, Bengali) |
| Share Links | Crypto-secure shareable URLs with expiration |
| Onboarding | Username setup, preferences, feature tour |
| Feedback | Bug reports, feature requests, praise |
| SEO | Dynamic OG images, hreflang, sitemap, robots.txt |
| PSEO | Programmatic article pages with structured data |
| Monitoring | Sentry + Spotlight (dev), OpenTelemetry |
| LLM Observability | LangFuse integration |
| Memory | Mem0 conversation memory extraction |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router + Turbopack) | 16.1.6 |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui | 19.2.4 / 4.1.18 |
| Language | TypeScript (strict mode) | 5.9.3 |
| Auth | Supabase SSR | 0.8.0 |
| Database | PostgreSQL + Drizzle ORM | 0.45.1 |
| Validation | Zod v4 | 4.0.0 |
| Testing | Vitest + Playwright + Storybook 10 | 4.0.17 / 1.58.1 |
| CI/CD | GitHub Actions + semantic-release | - |
| Deployment | Vercel | - |

---

## Architecture

**Serverless full-stack monolith** with:
- Server-rendered pages (SSR/SSG)
- 31 API route endpoints
- Middleware for auth + i18n + routing (`src/proxy.ts`)
- 138 React components
- 9 database tables in custom `vt_saas` schema

---

## Project Statistics

| Metric | Value |
|--------|-------|
| API Endpoints | 31 |
| React Components | 138 (~70 client) |
| Database Tables | 9 |
| SQL Migrations | 7 |
| Custom Hooks | 5 |
| CI/CD Workflows | 5 |
| Supported Languages | 3 (en, hi, bn) |
| E2E Test Files | 22 |
| Total Test Files | ~100+ |

---

## Quick Links

- [Architecture](./architecture.md) - System design and patterns
- [API Contracts](./api-contracts.md) - All 31 API endpoints
- [Data Models](./data-models.md) - Database schema (9 tables)
- [Component Inventory](./component-inventory.md) - All 138 components
- [Source Tree](./source-tree-analysis.md) - Directory structure
- [Development Guide](./development-guide.md) - Setup and workflows
- [Deployment Guide](./deployment-guide.md) - CI/CD and hosting
