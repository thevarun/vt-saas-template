import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getSiteUrl } from './config';

describe('getSiteUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns NEXT_PUBLIC_SITE_URL when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.example.com';
    const url = getSiteUrl();

    expect(url).toBe('https://www.example.com');
  });

  it('falls back to NEXT_PUBLIC_APP_URL via getBaseUrl', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    const url = getSiteUrl();

    expect(url).toBe('https://app.example.com');
  });

  it('falls back to VERCEL_PROJECT_PRODUCTION_URL in production', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'my-app.com';
    const url = getSiteUrl();

    expect(url).toBe('https://my-app.com');
  });

  it('falls back to VERCEL_URL for preview deployments', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';
    const url = getSiteUrl();

    expect(url).toBe('https://my-app-abc123.vercel.app');
  });

  it('returns localhost fallback when no env vars are set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const url = getSiteUrl();

    expect(url).toBe('http://localhost:3000');
  });

  it('prefers NEXT_PUBLIC_SITE_URL over all other env vars', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.com';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
    process.env.VERCEL_URL = 'my-app.vercel.app';
    const url = getSiteUrl();

    expect(url).toBe('https://custom.com');
  });

  it('returns URL without trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.example.com/';
    const url = getSiteUrl();

    expect(url).toBe('https://www.example.com');
  });
});
