# Deployment Strategy

## Deployment Steps

**Pre-Deployment Checklist:**
- [ ] All tests passing (`npm test && npm run test:e2e`)
- [ ] TypeScript compiles (`npm run check-types`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Bundle size analyzed (`ANALYZE=true npm run build`)
- [ ] DevTools excluded from production bundle (verify in analyzer)
- [ ] Database migrations applied to staging environment
- [ ] RLS policies verified in staging Supabase
- [ ] Environment variables set in Vercel/hosting platform

**Deployment Process:**

**Step 1: Database Migration (Staging)**
```sql
-- 1. Execute in Staging Supabase SQL Editor
CREATE SCHEMA IF NOT EXISTS health_companion;

-- 2. Run Drizzle migration
-- (Migration file generated via npm run db:generate)

-- 3. Apply RLS policies
ALTER TABLE health_companion.threads ENABLE ROW LEVEL SECURITY;
-- (See "Database Changes" section for full policies)

-- 4. Verify with test query
SELECT * FROM health_companion.threads LIMIT 1;
```

**Step 2: Deploy to Staging**
```bash
# Push feature branch
git push origin feature/multi-thread-chat

# Vercel auto-deploys preview (if configured)
# Or manual: vercel --prod=false

# Test on staging URL:
# - Create threads
# - Switch threads
# - Archive threads
# - Verify mobile/desktop responsive
# - Check Sentry for errors
```

**Step 3: Production Deployment**
```bash
# Merge to main (after PR approval)
git checkout main
git merge feature/multi-thread-chat
git push origin main

# Vercel auto-deploys to production
# Or manual: vercel --prod

# GitHub Actions runs:
# - CI checks
# - Build
# - Deploy
# - Semantic release (version bump)
```

**Step 4: Post-Deployment Verification**
- [ ] Health check: Visit `/chat` - verify sidebar loads
- [ ] Create test thread - verify persistence
- [ ] Switch threads - verify routing works
- [ ] Check Sentry for errors (first 30 minutes)
- [ ] Monitor Checkly uptime checks
- [ ] Verify logs in Logtail (Pino logs)

## Rollback Plan

**If Critical Issues Detected:**

**Option 1: Revert Deployment (Fast)**
```bash
# Vercel: Revert to previous deployment
vercel rollback <previous-deployment-url>

# Or via Vercel dashboard: Deployments → Previous → Promote
```

**Option 2: Git Revert (Clean)**
```bash
git revert <merge-commit-hash>
git push origin main
# Triggers new deployment without new feature
```

**Option 3: Feature Flag (If Implemented)**
```typescript
// Not in current scope, but document for future:
if (featureFlags.multiThreadChat) {
  // Show new UI
} else {
  // Show old chat UI
}
```

**Database Rollback:**
```sql
-- If needed (extreme case):
-- 1. Drop health_companion schema
DROP SCHEMA health_companion CASCADE;

-- 2. Old chat still works (uses Dify conversation_id only)
```

## Monitoring

**What to Monitor Post-Launch:**

**Application Metrics (Sentry):**
- Error rate in `/api/threads` endpoints
- Error rate in chat interface
- Failed thread creation attempts
- Slow API response times (>500ms)

**User Behavior (Analytics - if configured):**
- Number of threads created per user
- Thread switching frequency
- Archive usage
- Mobile vs. desktop usage split

**Database Performance:**
- Query execution time for `GET /api/threads`
- Index usage verification (Supabase query analyzer)
- Connection pool utilization

**Specific Alerts to Set:**
```
- API error rate >5% (15-minute window)
- Thread creation failures >10/hour
- Database query time >1 second
- Uptime <99.5% (Checkly)
```

**Monitoring Tools:**
- **Sentry:** Real-time error tracking, performance monitoring
- **Checkly:** API endpoint health checks (`/api/threads`, `/api/chat`)
- **Logtail:** Centralized log aggregation (Pino logs)
- **Vercel Analytics:** Traffic, performance, vitals
- **Supabase Dashboard:** Database metrics, query performance

## Scaling Considerations

**Current MVP Capacity:**
- <1000 concurrent users
- ~50 threads per user average
- ~10 messages per thread average
- Total: <500K thread records

**No Immediate Scaling Needed:**
- Vercel auto-scales serverless functions
- Supabase PostgreSQL handles 500K records easily
- Indexes in place for efficient queries

**Future Scaling Triggers (Post-MVP):**
- >10K active users → Consider read replicas
- >1M thread records → Implement pagination
- >100 requests/sec → Add caching layer (Redis)
- >50ms API latency → Optimize queries, add CDN

---

**🎉 Tech-Spec Complete!**

**Total Pages:** ~40 pages
**Sections:** 12 comprehensive sections
**Deployment Ready:** Yes

**Next Steps:**
1. Review tech-spec with team
2. Break into stories (Epic + 6 stories as outlined)
3. Run Story 3 spike (Assistant UI integration)
4. Begin implementation

**Questions or Clarifications:**
Reach out to John (PM) or Winston (Architect) for technical details.

---
