# PostHog pSEO Dashboard Setup Guide

## Overview

This guide shows you how to create analytics dashboards in PostHog to track the performance of your programmatic SEO (pSEO) pages. By the end, you'll have dashboards that answer:

- Which pSEO categories drive the most traffic?
- Which individual pages get the most views?
- What traffic sources send visitors to pSEO pages?
- How many pSEO visitors convert to signups?
- Is pSEO traffic growing over time?

**Prerequisites**:
- PostHog account set up (see Story 9.1)
- pSEO tracking integrated (see `pseo-tracking-integration.md`)
- At least some `pseo_page_viewed` events tracked

## Creating Basic Insights

### Step 1: Navigate to Insights

1. Log in to PostHog
2. Go to **Product Analytics** in the left sidebar
3. Click **Insights** (or go to `/insights`)
4. Click **+ New insight**

### Step 2: Create "Total pSEO Page Views" Insight

This shows the total number of pSEO page views over time.

**Configuration**:
1. **Insight type**: Trends (default)
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Filters**: None (shows all pSEO events)
4. **Breakdown**: None
5. **Date range**: Last 30 days
6. **Interval**: Day

**Click "Save & add to dashboard"**

**What it shows**: Total pSEO page views per day as a line chart.

**Use case**: Track overall pSEO traffic growth.

### Step 3: Create "pSEO Page Views by Category" Insight

Shows which pSEO categories (tools, templates, guides) are most popular.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Breakdown**:
   - Type: Event property
   - Property: `category`
4. **Date range**: Last 30 days
5. **Visualization**: Bar chart (or stacked area)

**Save as**: "pSEO Views by Category"

**What it shows**: Breakdown of page views per category (tools, templates, etc.).

**Use case**: Identify which categories to invest more in.

## Top Pages Analysis

### Insight: Top 20 pSEO Pages

Shows which individual pages get the most traffic.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Breakdown**:
   - Type: Event property
   - Property: `slug`
4. **Filters**: None
5. **Date range**: Last 30 days
6. **Display**: Table view (sorted by count descending)
7. **Limit**: Top 20

**Save as**: "Top pSEO Pages"

**What it shows**: Ranked list of pages by view count.

**Use case**:
- Double down on high-performing pages
- Improve or remove low-performing pages

### Insight: Category Breakdown with Slugs

See top pages within each category.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Filters**:
   - Property: `category`
   - Operator: equals
   - Value: `tools` (or your specific category)
4. **Breakdown**: `slug`
5. **Date range**: Last 30 days
6. **Display**: Bar chart

**Save as**: "Top Tools Pages" (repeat for each category)

**What it shows**: Top pages within the "tools" category.

**Pro tip**: Create one insight per category, then group on dashboard.

## Referral Sources Analysis

### Insight: Traffic Sources Breakdown

Shows where pSEO visitors come from.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Breakdown**:
   - Type: Event property
   - Property: `referrer`
4. **Date range**: Last 30 days
5. **Visualization**: Pie chart or bar chart

**Save as**: "pSEO Traffic Sources"

**What it shows**: Breakdown by referrer (Google, Twitter, direct, etc.).

**Use case**: Understand which channels drive pSEO traffic.

**Note**: `referrer` will be empty for direct traffic or same-origin navigation.

### Insight: Organic Search Traffic

Filter for only search engine traffic.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Filters**:
   - Property: `referrer`
   - Operator: contains
   - Value: `google.com` (or `bing.com`, `duckduckgo.com`)
4. **Date range**: Last 30 days

**Save as**: "pSEO Organic Search Traffic"

**What it shows**: Page views from search engines only.

**Use case**: Track SEO performance specifically.

**Pro tip**: Create separate insights for each search engine to compare.

## Conversion Funnel Setup

### Funnel: pSEO to Signup

Track how many pSEO visitors convert to signups.

**Configuration**:
1. **Insight type**: Funnel
2. **Steps**:
   - **Step 1**: `pseo_page_viewed` (entry point)
   - **Step 2**: `signup_started` (user clicked signup)
   - **Step 3**: `signup_completed` (user finished signup)
3. **Filters on Step 1**: None (all pSEO views)
4. **Conversion window**: 7 days
5. **Exclusion steps**: None

**Save as**: "pSEO → Signup Funnel"

**What it shows**:
- **Step 1**: Total pSEO page views
- **Step 2**: How many started signup (conversion rate %)
- **Step 3**: How many completed signup (final conversion %)

**Example output**:
```
Step 1: pseo_page_viewed       10,000 users (100%)
Step 2: signup_started          1,200 users (12%)
Step 3: signup_completed          600 users (6%)
```

**Use case**: Measure pSEO's impact on user acquisition.

### Funnel by Category

See which pSEO categories convert best.

**Configuration**:
1. Create same funnel as above
2. Add **Breakdown** on Step 1:
   - Type: Event property
   - Property: `category`

**Save as**: "pSEO → Signup by Category"

**What it shows**: Separate funnel for each category (tools, templates, guides).

**Use case**: Identify which categories drive highest-quality traffic.

**Example insight**:
- "tools" category: 15% signup conversion
- "templates" category: 8% signup conversion
→ Invest more in tools pSEO pages

### Advanced Funnel: pSEO to Activation

Track full user journey from pSEO to activation.

**Steps**:
1. `pseo_page_viewed`
2. `signup_completed`
3. `onboarding_completed`
4. `user_activated`

**Use case**: Measure long-term value of pSEO traffic.

## Time Series Analysis

### Insight: pSEO Traffic Trend

Track pSEO growth over time.

**Configuration**:
1. **Insight type**: Trends
2. **Series**:
   - Event: `pseo_page_viewed`
   - Aggregation: Total count
3. **Date range**: Last 90 days
4. **Interval**: Week
5. **Visualization**: Line chart

**Save as**: "pSEO Traffic Growth"

**What it shows**: Weekly pSEO page views over 3 months.

**Use case**:
- Track growth trajectory
- Identify seasonality or trends
- Measure impact of new pSEO pages

### Insight: Week-over-Week Growth

Compare current week to previous week.

**Configuration**:
1. **Insight type**: Trends
2. **Series**: `pseo_page_viewed` (total count)
3. **Date range**: Last 7 days
4. **Compare to**: Previous period
5. **Display**: Number with percentage change

**Save as**: "pSEO WoW Growth"

**What it shows**:
```
This week: 2,500 views (+15% vs last week)
```

**Use case**: Quick health check on pSEO performance.

## Dashboard Organization

### Creating a pSEO Dashboard

1. Go to **Dashboards** in PostHog
2. Click **+ New dashboard**
3. Name it: "pSEO Performance"
4. Add description: "Metrics for programmatic SEO pages"

### Recommended Layout

**Section 1: Overview (Top Row)**
- Total pSEO Page Views (big number)
- Week-over-Week Growth (percentage)
- Top 5 Pages (table)

**Section 2: Traffic Sources (Second Row)**
- Traffic Sources Breakdown (pie chart)
- Organic Search Traffic (line chart)

**Section 3: Category Performance (Third Row)**
- Views by Category (bar chart)
- Top Tools Pages (table)
- Top Templates Pages (table)

**Section 4: Conversion (Bottom Row)**
- pSEO → Signup Funnel (funnel chart)
- pSEO → Signup by Category (funnel chart)

### Dashboard Filters

Add dashboard-level filters to drill down:

1. Click **Add filter** at top of dashboard
2. Add filters for:
   - **Category**: Filter entire dashboard by category
   - **Date range**: Adjust time window
   - **Referrer**: Filter by traffic source

**Use case**: Quickly switch between categories without recreating insights.

## Sample Queries

### Query 1: pSEO Pages with >100 Views

Find high-traffic pages.

**PostHog SQL** (if using Data Warehouse):
```sql
SELECT
  properties.slug,
  properties.category,
  COUNT(*) as views
FROM events
WHERE event = 'pseo_page_viewed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY properties.slug, properties.category
HAVING views > 100
ORDER BY views DESC
```

**Insight equivalent**: Create Trends insight, breakdown by slug, filter "Total count > 100".

### Query 2: Referrer Domain Breakdown

Group referrers by domain (not full URL).

**Steps**:
1. In PostHog, use **Data Management → Actions**
2. Create action: "pSEO from Google"
   - Match: `pseo_page_viewed` events
   - Where: `referrer` contains `google.com`
3. Repeat for other domains
4. Create Trends insight comparing actions

**Use case**: Cleaner referrer analysis (groups all Google URLs together).

## Scheduled Reports

Set up weekly email reports.

**Steps**:
1. Go to your pSEO dashboard
2. Click **⋮ (menu)** → **Subscribe**
3. Configure:
   - Frequency: Weekly (Monday mornings)
   - Recipients: Your email
   - Format: PDF or Email
4. Click **Subscribe**

**What you get**: Weekly email with dashboard snapshots.

**Use case**: Stay informed without logging into PostHog daily.

## Alerts

Get notified of anomalies.

**Example Alert**: pSEO traffic drops >20%

**Steps**:
1. Go to **Alerts** in PostHog
2. Click **+ New alert**
3. Configure:
   - Insight: "Total pSEO Page Views"
   - Condition: Decreases by more than 20%
   - Window: Compared to last 7 days
   - Check frequency: Daily
   - Notification: Email
4. **Save**

**Use case**: Get alerted if pSEO traffic suddenly drops (possible indexing issue).

## Best Practices

### 1. Use Dashboards, Not Individual Insights
- Group related insights into dashboards
- Easier to share with team
- Better for storytelling

### 2. Set Consistent Date Ranges
- Use "Last 30 days" for most insights
- Use "Last 90 days" for trend analysis
- Use "Last 7 days" for health checks

### 3. Limit Breakdown Count
- Top 10-20 items max (avoid clutter)
- Use "Other" bucket for long tail

### 4. Add Context with Annotations
- Mark dates when you launched new pSEO pages
- Mark algorithm updates or site changes
- Helps explain spikes/drops

### 5. Compare Periods
- Always compare to previous period
- Shows if growth is real or seasonal

### 6. Use Funnels, Not Just Views
- Page views alone don't show value
- Funnels show conversion quality

### 7. Segment by User Properties
- Compare logged-in vs anonymous users
- Compare different user cohorts

## Common Questions

**Q: Why are some events missing `referrer`?**
A: `document.referrer` is empty for:
- Direct traffic (user typed URL)
- Bookmarks
- Same-origin navigation (internal links)
- Privacy-focused browsers blocking referrer

**Q: Can I see the full referrer URL?**
A: Yes, in event details. In insights, PostHog may group similar URLs.

**Q: How do I exclude internal traffic?**
A: Add filter:
- Property: `referrer`
- Operator: does not contain
- Value: `yourdomain.com`

**Q: Why don't conversion numbers match Google Analytics?**
A: Differences can occur due to:
- Ad blockers (block Google Analytics more than PostHog)
- Session definitions
- Attribution windows

**Q: Can I track pSEO revenue?**
A: Yes, if you track `purchase` or `subscription_started` events. Create funnel:
`pseo_page_viewed` → `signup_completed` → `subscription_started`

**Q: How do I export data?**
A: Click **⋮ (menu)** on insight → **Export** → CSV/JSON.

## Advanced Topics

### Cohort Analysis

Create cohort of "pSEO visitors" for retention analysis.

**Steps**:
1. Go to **People → Cohorts**
2. Click **+ New cohort**
3. Name: "pSEO Visitors"
4. Match: Users who performed `pseo_page_viewed`
5. **Save**

**Use in insights**: Filter any insight by this cohort to see pSEO user behavior.

### A/B Testing pSEO Templates

If you have multiple pSEO templates:

**Track template version**:
```tsx
trackEvent('pseo_page_viewed', {
  category: 'tools',
  slug: 'password-generator',
  referrer: document.referrer,
  // Add custom property (requires custom event type)
  template_version: 'v2',
})
```

**Create funnel breakdown**: By `template_version` to see which converts better.

### Session Recordings

Watch how users interact with pSEO pages.

**Steps**:
1. Go to **Session Replay** in PostHog
2. Filter sessions:
   - Event: `pseo_page_viewed`
   - Property: `category` equals `tools`
3. Watch recordings to see user behavior

**Use case**: Understand why users don't convert, identify UX issues.

### Heatmaps (with PostHog Toolbar)

See where users click on pSEO pages.

**Steps**:
1. Install PostHog Toolbar (browser extension)
2. Navigate to a pSEO page
3. Enable heatmap mode
4. See click density

**Use case**: Optimize CTAs and layout.

## Integration with Google Search Console

Combine PostHog and GSC for complete picture:

**PostHog**: What users do after landing on pSEO page
**GSC**: How users found the pSEO page in search

**Analysis workflow**:
1. **GSC**: Identify high-impression, low-click pages
   - Action: Improve title/meta to increase CTR
2. **PostHog**: Identify high-traffic, low-conversion pages
   - Action: Improve CTA or content to increase conversion

**Combined dashboard**:
- Import GSC data to PostHog (via API or manual)
- Create insights comparing GSC impressions to PostHog page views
- Find discrepancies (might indicate tracking issues)

## Next Steps

1. **Create** your first pSEO dashboard in PostHog
2. **Add** the recommended insights from this guide
3. **Review** dashboard weekly to track performance
4. **Iterate** on pSEO strategy based on data
5. **Share** dashboard with team for transparency

**Need help?** Check PostHog docs or contact the Analytics team.

Happy analyzing! 📊
