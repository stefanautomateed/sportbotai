/**
 * Share URL Generator API
 * 
 * Creates short share codes for analysis results that can be
 * shared on social media with proper OG image previews.
 * 
 * POST /api/share - Create a share code
 * GET /api/share?code=xyz - Get share data
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate a short alphanumeric code
function generateShortCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      homeTeam,
      awayTeam,
      league,
      verdict,
      risk,
      confidence,
      value,
      date,
      sport
    } = body;
    
    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { success: false, error: 'homeTeam and awayTeam are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique short code
    let code = generateShortCode();
    let attempts = 0;
    
    // Ensure uniqueness (retry if collision)
    while (attempts < 5) {
      const existing = await prisma.shareLink.findUnique({ where: { code } });
      if (!existing) break;
      code = generateShortCode();
      attempts++;
    }
    
    // Store the share data
    const shareLink = await prisma.shareLink.create({
      data: {
        code,
        homeTeam,
        awayTeam,
        league: league || 'Match',
        verdict: verdict || 'AI Analysis',
        risk: risk || 'MEDIUM',
        confidence: confidence ? parseInt(confidence) : 75,
        value: value || null,
        matchDate: date || null,
        sport: sport || 'soccer',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sportbotai.com'}/s/${shareLink.code}`;
    
    return NextResponse.json({
      success: true,
      code: shareLink.code,
      url: shareUrl,
    });
  } catch (error) {
    console.error('[Share API] Error creating share link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json(
      { success: false, error: 'Code is required' },
      { status: 400 }
    );
  }
  
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
    });
    
    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: 'Share link not found' },
        { status: 404 }
      );
    }
    
    // Check if expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Share link has expired' },
        { status: 410 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        homeTeam: shareLink.homeTeam,
        awayTeam: shareLink.awayTeam,
        league: shareLink.league,
        verdict: shareLink.verdict,
        risk: shareLink.risk,
        confidence: shareLink.confidence,
        value: shareLink.value,
        matchDate: shareLink.matchDate,
        sport: shareLink.sport,
      },
    });
  } catch (error) {
    console.error('[Share API] Error fetching share link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch share link' },
      { status: 500 }
    );
  }
}
