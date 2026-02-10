# Google Search Console Setup Guide

## Overview

Google Search Console (GSC) is a free tool that helps you monitor, maintain, and troubleshoot your site's presence in Google Search results. For pSEO (Programmatic SEO) pages, GSC is essential for:

- Verifying which pages are indexed by Google
- Monitoring search performance (impressions, clicks, CTR, position)
- Identifying indexing issues and errors
- Submitting sitemaps for faster discovery
- Requesting indexing for new pages

This guide covers the complete setup process for integrating your VT SaaS Template site with Google Search Console.

## Prerequisites

- **Domain Ownership**: You must own or have admin access to the domain
- **Deployed Site**: Your site must be accessible on a live URL (production or staging)
- **Google Account**: You need a Google account to access Search Console

## Property Verification

### Step 1: Create a New Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property" in the left sidebar
3. Choose property type:
   - **Domain property** (Recommended): Covers all subdomains and protocols (http/https)
   - **URL prefix**: Covers only specific URL pattern

**Recommendation**: Use Domain property to track www and non-www versions together.

### Step 2: Verify Ownership

Google offers multiple verification methods. Choose the one that best fits your deployment:

#### Method 1: DNS Record (Recommended for Domain Properties)

**Best for**: Production sites with DNS access

1. In GSC, select "DNS record" verification
2. Copy the TXT record value provided by Google
3. Add the TXT record to your domain's DNS settings:
   - **Type**: TXT
   - **Host**: @ (or your domain name)
   - **Value**: `google-site-verification=XXXXX`
   - **TTL**: 3600 (or default)
4. Wait for DNS propagation (can take up to 48 hours, usually <1 hour)
5. Return to GSC and click "Verify"

**DNS Provider Examples**:
- **Vercel**: Add TXT record in project Settings → Domains → DNS Records
- **Cloudflare**: DNS → Add Record → TXT
- **GoDaddy**: DNS Management → Add → TXT

#### Method 2: HTML File Upload

**Best for**: Static sites or sites with file upload access

1. In GSC, select "HTML file" verification
2. Download the verification HTML file (e.g., `google1234567890abcdef.html`)
3. Upload file to your site's root directory (`/public/` in Next.js)
4. Ensure file is accessible at: `https://yourdomain.com/google1234567890abcdef.html`
5. Return to GSC and click "Verify"

**For Next.js**:
```bash
# Place file in public directory
cp google1234567890abcdef.html ./public/
```

#### Method 3: HTML Meta Tag

**Best for**: Sites where you can edit HTML head

1. In GSC, select "HTML tag" verification
2. Copy the meta tag provided
3. Add to your site's `<head>` section:

```tsx
// In app/layout.tsx or app/[locale]/layout.tsx
export const metadata: Metadata = {
  verification: {
    google: 'YOUR_VERIFICATION_CODE',
  },
}
```

4. Deploy changes
5. Return to GSC and click "Verify"

#### Method 4: Google Analytics

**Best for**: Sites already using Google Analytics 4

1. Ensure you're an admin on the Google Analytics property
2. GA4 tracking code must be present on all pages
3. In GSC, select "Google Analytics" verification
4. Click "Verify"

### Step 3: Confirm Verification

Once verified, you should see a success message. The property will now appear in your GSC dashboard.

**Note**: Keep the verification method in place permanently. Removing it may cause you to lose access.

## Sitemap Submission

### Understanding Sitemaps

A sitemap is an XML file that lists all pages on your site, helping search engines discover and crawl content efficiently.

**For pSEO sites**: Sitemaps are critical because they help Google discover thousands of programmatically generated pages.

### Step 1: Generate Sitemap

**Option 1: Next.js Built-in Sitemap (Recommended)**

Next.js 15 supports automatic sitemap generation:

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://yourdomain.com'

  // Add pSEO pages dynamically
  const pseoPages = generatePseoPages() // Your pSEO page generator

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...pseoPages.map(page => ({
      url: `${baseUrl}/${page.category}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ]
}
```

Sitemap will be accessible at: `https://yourdomain.com/sitemap.xml`

**Option 2: Third-party Sitemap Generators**

For complex sites, consider using packages like `next-sitemap`.

### Step 2: Submit Sitemap to GSC

1. In Google Search Console, go to **Sitemaps** (left sidebar)
2. Enter your sitemap URL: `https://yourdomain.com/sitemap.xml`
3. Click "Submit"
4. Wait for Google to process (can take minutes to hours)

**Expected Status**: "Success" with number of discovered URLs

**Common Issues**:
- **Couldn't fetch**: Ensure sitemap is publicly accessible
- **Parse error**: Validate XML syntax at [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

### Step 3: Monitor Sitemap Status

Check regularly:
- **Discovered URLs**: Number of pages found in sitemap
- **Indexed URLs**: Number of pages actually indexed (usually lower)
- **Last read**: When Google last crawled the sitemap

**Tip**: Submit multiple sitemaps for large sites (e.g., one per pSEO category).

## URL Inspection Tool

### What It Does

The URL Inspection Tool shows you exactly how Google sees a specific page, including:
- Index status
- Crawl information
- Mobile usability
- Rendered HTML

### How to Use

1. In GSC, click the search bar at the top
2. Enter the full URL of a page (e.g., `https://yourdomain.com/tools/password-generator`)
3. Click "Inspect"

**Possible Results**:
- **URL is on Google**: Page is indexed ✅
- **URL is not on Google**: Page is not indexed ❌
- **URL is on Google but has issues**: Indexed with warnings ⚠️

### Requesting Indexing

For new pSEO pages that aren't yet indexed:

1. Inspect the URL (as above)
2. If not indexed, click **"Request Indexing"**
3. Wait for Google to crawl (can take hours to days)

**Important Limits**:
- Individual indexing requests: Limited quota per day
- Use sparingly for important pages
- Rely on sitemaps for bulk discovery

### Interpreting Results

**Coverage Details**:
- **Crawl**: When Google last visited the page
- **User-declared canonical**: The canonical URL you specified
- **Google-selected canonical**: The URL Google chose as canonical
- **Crawlability**: Whether Googlebot can access the page

**Mobile Usability**:
- Check if page is mobile-friendly
- Fix any mobile issues (important for pSEO)

## Indexing Status Verification

### Coverage Report

1. Go to **Indexing → Pages** in GSC
2. Review the dashboard:
   - **Indexed pages**: Successfully indexed
   - **Not indexed**: Pages excluded or with errors

**Why pages might not be indexed**:
- **Crawl errors**: 404, 5xx server errors
- **Noindex tag**: Page has `<meta name="robots" content="noindex">`
- **Blocked by robots.txt**: Crawlers can't access
- **Duplicate content**: Google chose a different canonical
- **Low quality**: Google deemed content not valuable (rare for pSEO)

### Checking Specific pSEO Pages

1. Go to **Indexing → Pages**
2. Click "Not indexed" section
3. Review reasons (e.g., "Discovered - currently not indexed")
4. Fix issues and request reindexing

**Common pSEO Issues**:
- **Thin content**: Ensure each page has unique, valuable content
- **Duplicate titles**: Make sure each pSEO page has unique title
- **Slow rendering**: Check page load speed

## Search Performance Monitoring

### Overview Dashboard

Go to **Performance → Search results** to see:
- **Total clicks**: Users clicking from Google to your site
- **Total impressions**: Times your pages appeared in search
- **Average CTR**: Click-through rate (clicks ÷ impressions)
- **Average position**: Your average ranking in search results

### Key Metrics for pSEO

#### 1. **Impressions**
Number of times your pSEO pages appeared in search results.

**Goal**: Maximize impressions for target keywords.

**How to analyze**:
- Filter by **Page** → Look for `/tools/*` or `/templates/*` patterns
- Identify which pSEO categories get most impressions

#### 2. **Clicks**
Number of users clicking through to your pSEO pages.

**Goal**: High click volume from relevant searches.

**How to analyze**:
- Filter by **Page** → Sort by clicks
- Identify top-performing pSEO pages

#### 3. **CTR (Click-Through Rate)**
Percentage of impressions that result in clicks.

**Goal**: >3% average CTR (varies by industry).

**How to improve**:
- Optimize title tags (make them compelling)
- Improve meta descriptions
- Test different formats

#### 4. **Position**
Average ranking position in Google results (1-100).

**Goal**: Top 10 (first page) or ideally Top 3.

**How to improve**:
- Improve content quality
- Build backlinks
- Optimize for user intent

### Filtering by pSEO Category

To analyze specific pSEO categories:

1. Go to **Performance → Search results**
2. Click "**+ NEW**" filter
3. Choose "**Page**"
4. Select "**Custom (regex)**"
5. Enter regex pattern:
   - All tools: `.*\/tools\/.*`
   - Specific tool: `.*\/tools\/password-generator`
   - All categories: `.*\/(tools|templates|guides)\/.*`
6. Apply filter

### Top Queries Report

See which search terms bring traffic:

1. In Performance, switch to "**Queries**" tab
2. Sort by clicks or impressions
3. Identify:
   - **High-volume keywords**: Lots of impressions
   - **High-intent keywords**: Good CTR despite lower volume
   - **Ranking opportunities**: High impressions, low CTR (improve meta descriptions)

### Date Range Analysis

Compare performance over time:

1. Click date selector (default: Last 3 months)
2. Choose "**Compare**" tab
3. Select periods (e.g., "Last 28 days" vs "Previous period")
4. Analyze trends:
   - Growing traffic = Good ✅
   - Declining traffic = Investigate ❌

## Troubleshooting Common Issues

### Issue 1: Sitemap Not Indexed

**Symptoms**: Sitemap shows 0 indexed pages after days/weeks.

**Solutions**:
1. Check sitemap is accessible publicly (not behind auth)
2. Validate XML syntax
3. Ensure URLs in sitemap return 200 status codes
4. Check robots.txt isn't blocking Google
5. Request manual indexing for a few URLs

### Issue 2: Pages Discovered but Not Indexed

**Symptoms**: Pages show "Discovered - currently not indexed".

**Solutions**:
1. **Wait**: Google can take weeks to index new pages
2. **Improve content quality**: Add more unique, valuable content
3. **Build internal links**: Link to pages from indexed pages
4. **Check server capacity**: Ensure server can handle Googlebot crawls
5. **Request indexing**: Use URL Inspection tool (for important pages only)

### Issue 3: Duplicate Content

**Symptoms**: Pages marked as "Duplicate" or Google choosing different canonical.

**Solutions**:
1. Set explicit canonical tags:
   ```tsx
   // In page component
   export const metadata = {
     alternates: {
       canonical: 'https://yourdomain.com/tools/password-generator',
     },
   }
   ```
2. Ensure each pSEO page has unique content (not just template with different slug)
3. Use `noindex` for true duplicates

### Issue 4: Crawl Errors

**Symptoms**: 404 or 5xx errors in Coverage report.

**Solutions**:
1. Fix broken links
2. Ensure pSEO pages are dynamically generated correctly
3. Check server logs for errors
4. Test pages with URL Inspection tool

## Best Practices

### 1. Regular Monitoring
- Check GSC **weekly** for indexing issues
- Review performance **monthly** to track growth
- Set up email alerts for critical errors

### 2. Sitemap Hygiene
- Update sitemap when adding/removing pSEO pages
- Remove 404 pages from sitemap
- Keep sitemap under 50,000 URLs (split if needed)

### 3. Quality over Quantity
- Don't create low-quality pSEO pages just for volume
- Ensure each page provides unique value
- Google penalizes thin content

### 4. Mobile-First
- All pSEO pages must be mobile-friendly
- Test with GSC Mobile Usability report
- Google indexes mobile version first

### 5. Page Speed
- Fast pages rank better
- Use Lighthouse or PageSpeed Insights
- Optimize images, minimize JS

## Additional Resources

- [Google Search Console Help](https://support.google.com/webmasters/)
- [Google Search Central Blog](https://developers.google.com/search/blog)
- [Sitemaps Protocol](https://www.sitemaps.org/)
- [Robots.txt Specification](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

## Integration with PostHog Analytics

Google Search Console shows **search traffic**, while PostHog shows **user behavior after arrival**.

**Combined workflow**:
1. **GSC**: Identify which pSEO pages get search impressions/clicks
2. **PostHog**: Track what users do after landing (using `pseo_page_viewed` events)
3. **Funnel**: GSC impression → click → PostHog `pseo_page_viewed` → `signup_started` → `signup_completed`

This gives you the complete picture from search to conversion.
