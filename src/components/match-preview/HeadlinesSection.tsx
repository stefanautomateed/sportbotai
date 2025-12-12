/**
 * Headlines Section Component
 * 
 * The viral hook of the match preview.
 * Big, bold, shareable facts that users want to screenshot and share.
 */

'use client';

import { useState } from 'react';

interface Headline {
  icon: string;
  text: string;
  category: string;
  impactLevel: 'high' | 'medium' | 'low';
}

interface HeadlinesSectionProps {
  headlines: Headline[];
  homeTeam: string;
  awayTeam: string;
}

export default function HeadlinesSection({
  headlines,
  homeTeam,
  awayTeam,
}: HeadlinesSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyHeadlines = async () => {
    const text = headlines.map(h => `${h.icon} ${h.text}`).join('\n');
    const fullText = `${homeTeam} vs ${awayTeam}\n\n${text}\n\n📊 via SportBot AI`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!headlines || headlines.length === 0) {
    return null;
  }

  // Sort by impact level
  const sortedHeadlines = [...headlines].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impactLevel] - order[b.impactLevel];
  });

  const impactStyles = {
    high: 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30',
    medium: 'bg-white/5 border-white/10',
    low: 'bg-white/5 border-white/10',
  };

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Match Headlines</h3>
            <p className="text-xs text-text-muted">Key facts you need to know</p>
          </div>
        </div>
        
        {/* Copy button */}
        <button
          onClick={copyHeadlines}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-text-secondary hover:text-white"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Headlines list */}
      <div className="p-4 space-y-3">
        {sortedHeadlines.slice(0, 6).map((headline, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-3 rounded-xl border ${impactStyles[headline.impactLevel]} transition-all hover:scale-[1.01]`}
          >
            <span className="text-2xl flex-shrink-0">{headline.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium leading-tight">{headline.text}</p>
              {headline.impactLevel === 'high' && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-400">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                  Key insight
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Share prompt */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-3 text-center">
          <p className="text-xs text-text-secondary">
            📱 Screenshot and share these stats with your friends!
          </p>
        </div>
      </div>
    </div>
  );
}
