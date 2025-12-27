/**
 * Logo Proxy API
 * 
 * Proxies external team logo images with proper caching.
 * - Caches for 7 days (immutable logos rarely change)
 * - Reduces payload by serving through CDN
 * - Avoids CORS issues
 * 
 * Usage: /api/logo?url=https://a.espncdn.com/...
 */

import { NextRequest, NextResponse } from 'next/server';

// Allow these domains for logos
const ALLOWED_DOMAINS = [
  'a.espncdn.com',
  'media.api-sports.io',
  'media-cdn.cortextech.io',
  'media-cdn.incrowdsports.com',
  'upload.wikimedia.org',
  'crests.football-data.org',
  'flagcdn.com',
  'assets.laliga.com',
  'resources.premierleague.com',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const logoUrl = searchParams.get('url');

  if (!logoUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const url = new URL(logoUrl);
    
    // Security: only allow whitelisted domains
    if (!ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Fetch the image
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'SportBot-AI/1.0',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch logo', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return with long cache lifetime (7 days)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
        'CDN-Cache-Control': 'public, max-age=604800, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (error) {
    console.error('Logo proxy error:', error);
    return new NextResponse('Failed to proxy logo', { status: 500 });
  }
}
