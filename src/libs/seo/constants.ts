/**
 * SEO Constants
 *
 * Default values for social metadata, Open Graph, and Twitter Cards.
 * Centralized for consistency across the application.
 */

import { SITE_CONFIG } from '@/config/site-config';

export const SITE_NAME = SITE_CONFIG.brand.name;

export const DEFAULT_OG_IMAGE = '/og-image.png';

export const DEFAULT_TITLE = 'VT SaaS Template - Build Your SaaS Fast';

export const DEFAULT_DESCRIPTION
  = 'Production-ready SaaS template with authentication, internationalization, and AI chat. Built with Next.js 15, Supabase, and TypeScript.';

/**
 * Dynamic OG image generation endpoint
 */
export const OG_IMAGE_ENDPOINT = '/api/og';

/**
 * Standard Open Graph image dimensions (recommended by Facebook, Twitter, LinkedIn)
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
