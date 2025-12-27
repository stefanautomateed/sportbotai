/**
 * Share Page - /s/[code]
 * 
 * This page displays shared analysis results with proper OG meta tags
 * for social media previews (WhatsApp, X/Twitter, etc.)
 * 
 * Features:
 * - Short, clean URLs: sportbotai.com/s/abc123
 * - Dynamic OG image from /api/og
 * - Twitter Card support
 * - Redirects to analyzer for new analysis
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, TrendingUp } from 'lucide-react';

interface SharePageProps {
  params: Promise<{ code: string }>;
}

// Fetch share data for metadata
async function getShareData(code: string) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
    });
    
    if (!shareLink) return null;
    
    // Check if expired
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return null;
    }
    
    // Increment view count
    await prisma.shareLink.update({
      where: { code },
      data: { views: { increment: 1 } },
    });
    
    return shareLink;
  } catch {
    return null;
  }
}

// Generate dynamic metadata with OG tags
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getShareData(code);
  
  if (!data) {
    return {
      title: 'Analysis Not Found - SportBot AI',
    };
  }
  
  const title = `${data.homeTeam} vs ${data.awayTeam} | SportBot AI`;
  const description = `${data.verdict} • Risk: ${data.risk} • Confidence: ${data.confidence}% | AI-powered sports analysis`;
  
  // Build OG image URL with all parameters
  const ogParams = new URLSearchParams({
    home: data.homeTeam,
    away: data.awayTeam,
    league: data.league,
    verdict: data.verdict,
    risk: data.risk,
    confidence: String(data.confidence),
    ...(data.value && { value: data.value }),
    ...(data.matchDate && { date: data.matchDate }),
  });
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sportbotai.com';
  const ogImage = `${siteUrl}/api/og?${ogParams.toString()}`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/s/${code}`,
      siteName: 'SportBot AI',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${data.homeTeam} vs ${data.awayTeam} Analysis`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@SportBotAI',
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { code } = await params;
  const data = await getShareData(code);
  
  if (!data) {
    notFound();
  }
  
  // Risk color mapping
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/20';
      case 'HIGH': return 'text-red-400 bg-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };
  
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24">
          {/* Match Card */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-8 shadow-xl">
            {/* League Badge */}
            <div className="flex items-center justify-center mb-6">
              <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                {data.league}
              </span>
            </div>
            
            {/* Teams */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{data.homeTeam}</h2>
                <span className="text-sm text-text-muted">Home</span>
              </div>
              
              <div className="text-3xl font-light text-text-muted">vs</div>
              
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{data.awayTeam}</h2>
                <span className="text-sm text-text-muted">Away</span>
              </div>
            </div>
            
            {/* Verdict */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-lg font-semibold text-emerald-400">{data.verdict}</span>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-bg-primary rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{data.confidence}%</div>
                <div className="text-xs text-text-muted">Confidence</div>
              </div>
              
              <div className="text-center p-4 bg-bg-primary rounded-xl">
                <Shield className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                <div className={`text-lg font-bold ${getRiskColor(data.risk).split(' ')[0]}`}>
                  {data.risk}
                </div>
                <div className="text-xs text-text-muted">Risk Level</div>
              </div>
              
              {data.value && (
                <div className="text-center p-4 bg-bg-primary rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-emerald-400">{data.value}</div>
                  <div className="text-xs text-text-muted">Best Value</div>
                </div>
              )}
            </div>
            
            {/* CTA */}
            <div className="text-center">
              <Link
                href="/analyzer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Analyze Your Match
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-4 text-sm text-text-muted">
                Get AI-powered analysis for any match in 60 seconds
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-muted">
              Powered by <span className="text-white font-medium">SportBot AI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
