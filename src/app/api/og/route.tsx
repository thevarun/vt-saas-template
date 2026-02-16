/**
 * Dynamic Open Graph Image Generation Endpoint
 *
 * Generates custom OG images on-the-fly using @vercel/og.
 * Runs on Vercel Edge Network for low-latency worldwide.
 *
 * Query Parameters:
 * - title: Page title to display (optional, defaults to site name)
 * - description: Page description to display (optional)
 *
 * @example
 * GET /api/og
 * GET /api/og?title=Dashboard
 * GET /api/og?title=Dashboard&description=View your analytics
 */

import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_NAME } from '@/libs/seo/constants';

// Use edge runtime for optimal performance
export const runtime = 'edge';

/**
 * Brand colors extracted from Tailwind theme
 * Using HSL values from src/styles/global.css (dark mode)
 */
const BRAND_COLORS = {
  // Dark mode background: --background: 222.2 84% 4.9%
  background: 'hsl(222.2, 84%, 4.9%)',
  // Dark mode foreground: --foreground: 210 40% 98%
  text: 'hsl(210, 40%, 98%)',
  // Dark mode muted-foreground: --muted-foreground: 215 20.2% 65.1%
  muted: 'hsl(215, 20.2%, 65.1%)',
  // Accent for branding
  accent: 'hsl(217.2, 91.2%, 59.8%)', // blue-500 equivalent
};

/**
 * GET handler for OG image generation
 *
 * Generates a PNG image (1200x630) with title and description.
 * Images are automatically cached at the edge for fast subsequent requests.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract and sanitize parameters (limit input length to prevent abuse)
    const rawTitle = (searchParams.get('title') || '').slice(0, 200);
    const rawDescription = (searchParams.get('description') || '').slice(0, 500);

    const title = rawTitle || SITE_NAME;
    const description = rawDescription;

    // Truncate for display in image
    const truncatedTitle = title.length > 60 ? `${title.slice(0, 60)}...` : title;
    const truncatedDescription
      = description.length > 120 ? `${description.slice(0, 120)}...` : description;

    // Calculate dynamic font sizes based on title length
    const titleFontSize = title.length > 40 ? 56 : 72;

    // Load Inter Bold font from Google Fonts for better typography
    let fontData: ArrayBuffer | null = null;
    try {
      const fontResponse = await fetch(
        'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf',
      );
      if (fontResponse.ok && fontResponse.headers.get('content-type')?.includes('font')) {
        fontData = await fontResponse.arrayBuffer();
      }
    } catch {
      // Font loading failed - will use sans-serif fallback
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BRAND_COLORS.background,
            color: BRAND_COLORS.text,
            padding: '80px',
            fontFamily: fontData ? 'Inter' : 'sans-serif',
          }}
        >
          {/* Main title */}
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 700,
              textAlign: 'center',
              maxWidth: '1040px',
              lineHeight: 1.2,
              marginBottom: description ? '20px' : '0',
            }}
          >
            {truncatedTitle}
          </div>

          {/* Description (if provided) */}
          {truncatedDescription && (
            <div
              style={{
                fontSize: 32,
                textAlign: 'center',
                maxWidth: '900px',
                color: BRAND_COLORS.muted,
                lineHeight: 1.4,
              }}
            >
              {truncatedDescription}
            </div>
          )}

          {/* Branding footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '80px',
              fontSize: 24,
              color: BRAND_COLORS.muted,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {SITE_NAME}
          </div>

          {/* Decorative accent */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '80px',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              backgroundColor: BRAND_COLORS.accent,
            }}
          />
        </div>
      ),
      {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        fonts: fontData
          ? [
              {
                name: 'Inter',
                data: fontData,
                weight: 700,
                style: 'normal',
              },
            ]
          : undefined,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      },
    );
  } catch (error) {
    console.error('OG image generation failed:', error);

    // Redirect to static fallback image (AC7: fallback to static default image)
    return Response.redirect(new URL('/og-image.png', request.url), 302);
  }
}
