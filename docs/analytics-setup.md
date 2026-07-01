# Analytics Setup & Provider Swap Guide

This guide explains how the analytics system works and how to swap providers.

## Architecture Overview

The analytics system uses a **provider pattern** to abstract the underlying analytics service. This allows you to:

- Start with PostHog
- Swap to Amplitude, Mixpanel, or another provider
- Build a custom analytics provider
- Test without external dependencies (console provider)

## Provider Interface

All analytics providers implement this interface:

```typescript
export type AnalyticsProvider = {
  // Initialize the provider (client-side only)
  init: (config: AnalyticsConfig) => void

  // Identify a user
  identify: (userId: string, properties?: UserProperties) => void

  // Track an event
  track: (eventName: string, properties?: EventProperties) => void

  // Reset user identity (on logout)
  reset: () => void
}
```

## Current Setup (PostHog)

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to US
```

### 2. Automatic Initialization

Analytics initializes automatically when the app loads:

```tsx
// src/app/[locale]/layout.tsx
import { PostHogProvider } from '@/components/analytics/PostHogProvider'

export default function RootLayout({ children }) {
  return (
    <PostHogProvider>
      {children}
    </PostHogProvider>
  )
}
```

### 3. User Identification

Users are automatically identified when they log in:

```tsx
// src/app/[locale]/(auth)/layout.tsx
import { UserIdentifier } from '@/components/analytics/UserIdentifier'

export default function AuthLayout({ children }) {
  return (
    <>
      <UserIdentifier />
      {children}
    </>
  )
}
```

## Swapping to Amplitude

### Step 1: Install Amplitude SDK

```bash
pnpm add @amplitude/analytics-browser
```

### Step 2: Create Amplitude Provider

```typescript
// src/libs/analytics/providers/amplitude.ts
import * as amplitude from '@amplitude/analytics-browser'
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types'

export class AmplitudeProvider implements AnalyticsProvider {
  private initialized = false

  init(config: AnalyticsConfig): void {
    if (typeof window === 'undefined' || this.initialized) {
      return
    }

    amplitude.init(config.apiKey, {
      defaultTracking: {
        pageViews: true,
        sessions: true,
      },
    })

    this.initialized = true
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    const identifyEvent = new amplitude.Identify()
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        identifyEvent.set(key, value)
      })
    }

    amplitude.identify(identifyEvent)
    amplitude.setUserId(userId)
  }

  track(eventName: string, properties?: EventProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    amplitude.track(eventName, properties)
  }

  reset(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    amplitude.reset()
  }
}
```

### Step 3: Update Client Factory

```typescript
// src/libs/analytics/client.ts
import { AmplitudeProvider } from './providers/amplitude'
import { ConsoleProvider } from './providers/console'
import type { AnalyticsProvider } from './types'

let analyticsInstance: AnalyticsProvider | null = null

export function getAnalyticsProvider(): AnalyticsProvider {
  if (analyticsInstance) {
    return analyticsInstance
  }

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_KEY // Changed from POSTHOG

  if (apiKey) {
    analyticsInstance = new AmplitudeProvider() // Changed from PostHogProvider
  } else {
    analyticsInstance = new ConsoleProvider()
  }

  return analyticsInstance
}
```

### Step 4: Update Environment Variables

```bash
# .env.local
NEXT_PUBLIC_AMPLITUDE_KEY=your_amplitude_api_key
```

### Step 5: Update initAnalytics

```typescript
// src/libs/analytics/index.ts
export function initAnalytics(): void {
  const provider = getAnalyticsProvider()
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_KEY || '' // Changed from POSTHOG
  const apiHost = process.env.NEXT_PUBLIC_AMPLITUDE_HOST

  provider.init({
    apiKey,
    apiHost,
    enabled: !!apiKey,
  })
}
```

That's it! No changes needed to components or tracking code.

## Swapping to Mixpanel

### Step 1: Install Mixpanel SDK

```bash
pnpm add mixpanel-browser
```

### Step 2: Create Mixpanel Provider

```typescript
// src/libs/analytics/providers/mixpanel.ts
import mixpanel from 'mixpanel-browser'
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types'

export class MixpanelProvider implements AnalyticsProvider {
  private initialized = false

  init(config: AnalyticsConfig): void {
    if (typeof window === 'undefined' || this.initialized) {
      return
    }

    mixpanel.init(config.apiKey, {
      track_pageview: true,
      persistence: 'localStorage',
    })

    this.initialized = true
  }

  identify(userId: string, properties?: UserProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    mixpanel.identify(userId)
    if (properties) {
      mixpanel.people.set(properties)
    }
  }

  track(eventName: string, properties?: EventProperties): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    mixpanel.track(eventName, properties)
  }

  reset(): void {
    if (typeof window === 'undefined' || !this.initialized) {
      return
    }

    mixpanel.reset()
  }
}
```

### Step 3: Update Client Factory

Follow the same pattern as Amplitude, but use `MixpanelProvider` instead.

## Custom Provider Example

Building your own analytics provider for a custom backend:

```typescript
// src/libs/analytics/providers/custom.ts
import type { AnalyticsConfig, AnalyticsProvider, EventProperties, UserProperties } from '../types'

export class CustomProvider implements AnalyticsProvider {
  private apiUrl: string = ''
  private apiKey: string = ''

  init(config: AnalyticsConfig): void {
    if (typeof window === 'undefined') {
      return
    }

    this.apiUrl = config.apiHost || 'https://your-api.com'
    this.apiKey = config.apiKey
  }

  async identify(userId: string, properties?: UserProperties): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    await fetch(`${this.apiUrl}/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ userId, properties }),
    })
  }

  async track(eventName: string, properties?: EventProperties): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    await fetch(`${this.apiUrl}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  reset(): void {
    // Clear any local state
  }
}
```

## Testing Your Provider

### Unit Tests

Test your provider implementation:

```typescript
// src/libs/analytics/providers/__tests__/amplitude.test.ts
import { describe, expect, it, vi } from 'vitest'
import * as amplitude from '@amplitude/analytics-browser'
import { AmplitudeProvider } from '../amplitude'

vi.mock('@amplitude/analytics-browser')

describe('AmplitudeProvider', () => {
  it('initializes Amplitude with correct config', () => {
    const provider = new AmplitudeProvider()
    provider.init({ apiKey: 'test-key', enabled: true })

    expect(amplitude.init).toHaveBeenCalledWith(
      'test-key',
      expect.objectContaining({
        defaultTracking: expect.any(Object),
      }),
    )
  })

  // Add more tests...
})
```

### Manual Testing

1. Set up the new provider
2. Check browser console for initialization
3. Trigger events and verify in provider's dashboard
4. Test user identification on login
5. Test reset on logout

## Configuration Differences

### PostHog vs Amplitude vs Mixpanel

| Feature | PostHog | Amplitude | Mixpanel |
|---------|---------|-----------|----------|
| **Page Views** | `capture_pageview: true` | `defaultTracking.pageViews: true` | `track_pageview: true` |
| **IP Anonymization** | `ip: false` | Built-in | `ip: false` |
| **Session Tracking** | `disable_session_recording` | `defaultTracking.sessions` | Built-in |
| **User Properties** | `identify(id, props)` | `Identify().set()` | `people.set()` |

## Migration Checklist

When migrating from one provider to another:

- [ ] Install new SDK package
- [ ] Create provider implementation
- [ ] Update environment variables
- [ ] Update client factory
- [ ] Update initAnalytics config
- [ ] Test in development
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Verify events in new dashboard
- [ ] Deploy to production
- [ ] Monitor for errors

## Development vs Production

### Development (no API key):
- Uses ConsoleProvider
- Logs events to console
- No external requests
- Safe for testing

### Production (with API key):
- Uses real provider (PostHog, Amplitude, etc.)
- Sends events to external service
- Requires environment variables
- Needs privacy compliance

## Troubleshooting

### Events not showing up

1. Check API key is set: `console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY)`
2. Check provider initialization: Look for init log in console
3. Check network tab: Verify requests are being sent
4. Check provider dashboard: Events may be delayed

### TypeScript errors

1. Ensure provider implements `AnalyticsProvider` interface
2. Check method signatures match exactly
3. Verify return types (all methods return `void`)

### Client-side only

Remember: Analytics MUST run client-side only. Always check:

```typescript
if (typeof window === 'undefined') {
  return
}
```

## Further Reading

- [PostHog Documentation](https://posthog.com/docs)
- [Amplitude Documentation](https://docs.amplitude.com/)
- [Mixpanel Documentation](https://docs.mixpanel.com/)
- [Analytics Provider Pattern](https://en.wikipedia.org/wiki/Strategy_pattern)
