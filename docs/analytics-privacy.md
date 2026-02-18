# Analytics Privacy & GDPR Compliance

This document outlines the privacy features and GDPR compliance measures implemented in the analytics system.

## Privacy-First Configuration

### IP Anonymization

IP addresses are anonymized by default to protect user privacy:

```typescript
posthog.init(apiKey, {
  ip: false, // Anonymizes IP addresses
  // ... other config
})
```

**Why**: IP addresses can be considered personally identifiable information (PII) under GDPR. Anonymizing them reduces privacy risks.

### Session Recording

Session recordings are disabled by default and require explicit opt-in:

```typescript
posthog.init(apiKey, {
  disable_session_recording: true, // Session recordings disabled
  // ... other config
})
```

**To enable session recordings** (only if you have user consent):

1. Update PostHog provider configuration
2. Set `disable_session_recording: false`
3. Implement user consent UI
4. Only enable after user accepts

### Autocapture

Autocapture is enabled for basic page view tracking:

```typescript
posthog.init(apiKey, {
  autocapture: true, // Auto-capture page views
  capture_pageview: true,
  capture_pageleave: true,
  // ... other config
})
```

**What's captured**:
- Page views
- Page leaves
- Basic navigation events

**What's NOT captured**:
- Form inputs
- User-generated content
- Sensitive data

## Data Collection Practices

### What We Track

**User Identity** (authenticated users only):
- User ID (UUID from Supabase)
- Email address
- Account creation date

**Events** (via explicit tracking):
- Event name
- Event properties (you control what's sent)
- Timestamp

**Automatic Events** (from PostHog):
- Page views
- Page navigation
- Session duration

### What We DON'T Track

- Passwords
- Credit card information
- Social security numbers
- Health information
- Other sensitive PII

## GDPR Compliance

### User Rights

Under GDPR, users have the right to:

1. **Access**: View their data
2. **Rectification**: Correct their data
3. **Erasure**: Delete their data
4. **Portability**: Export their data
5. **Object**: Opt-out of tracking

### Implementing User Opt-Out

To allow users to opt-out of analytics:

```typescript
// In your settings page
import { resetUser } from '@/libs/analytics'

function optOutOfAnalytics() {
  // Reset user identity
  resetUser()

  // Set opt-out flag in localStorage
  localStorage.setItem('analytics_opt_out', 'true')

  // Optionally, prevent future initialization
  // (implement check in PostHogProvider)
}
```

### Data Retention

Configure data retention in your PostHog project settings:

1. Go to PostHog → Project Settings → Data Retention
2. Set appropriate retention period (e.g., 90 days)
3. Enable automatic deletion of old events

### Data Processing Agreement

PostHog provides a Data Processing Agreement (DPA) for GDPR compliance:

- Sign up: https://posthog.com/docs/privacy/dpa
- Review PostHog's privacy policy: https://posthog.com/privacy

## Cookie Consent Integration

### Basic Implementation

```typescript
// Example cookie consent integration
import { initAnalytics } from '@/libs/analytics'

function CookieConsent() {
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    // Check for existing consent
    const hasConsent = localStorage.getItem('analytics_consent') === 'true'
    setConsent(hasConsent)

    if (hasConsent) {
      initAnalytics()
    }
  }, [])

  function handleAccept() {
    localStorage.setItem('analytics_consent', 'true')
    setConsent(true)
    initAnalytics()
  }

  if (consent) return null

  return (
    <div className="cookie-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
    </div>
  )
}
```

### Recommended Libraries

- **react-cookie-consent**: https://www.npmjs.com/package/react-cookie-consent
- **@porscheofficial/cookie-consent-banner**: https://github.com/porscheofficial/cookie-consent-banner

## Privacy Policy Requirements

Your privacy policy should mention:

1. **What analytics tool you use**: PostHog
2. **What data is collected**: User ID, email, events, page views
3. **Why you collect it**: To improve the product
4. **How long you store it**: Your retention period
5. **User rights**: Access, deletion, opt-out
6. **Contact information**: How users can request data deletion

## Best Practices

### DO:
✅ Anonymize IP addresses
✅ Disable session recording by default
✅ Get user consent before tracking
✅ Document what you track
✅ Provide opt-out mechanism
✅ Set data retention limits
✅ Use secure connections (HTTPS)

### DON'T:
❌ Track sensitive information (passwords, SSNs, etc.)
❌ Track children without parental consent
❌ Share data with third parties without consent
❌ Use tracking for discrimination
❌ Store data indefinitely
❌ Track without user knowledge

## Development Mode

In development (without PostHog API key), all analytics events are logged to console instead of being sent to PostHog:

```bash
📊 [Analytics] Console mode enabled (no API key configured)
👤 [Analytics] Identify User
   User ID: user-123
   Properties: { email: 'test@example.com' }
```

This allows you to:
- Verify tracking implementation
- Debug analytics issues
- Test without affecting production data

## Further Reading

- [PostHog Privacy Documentation](https://posthog.com/docs/privacy)
- [GDPR Overview](https://gdpr.eu/)
- [PostHog GDPR Guide](https://posthog.com/docs/privacy/gdpr-compliance)
- [Cookie Law Explained](https://gdpr.eu/cookies/)
