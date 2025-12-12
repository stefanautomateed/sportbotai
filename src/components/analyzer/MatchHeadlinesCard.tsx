/**
 * Match Headlines Card
 * 
 * Displays auto-generated, shareable one-liner facts about the match.
 * Designed to be screenshot-worthy and viral.
 * 
 * Examples:
 * - "🔥 Arsenal: 12 home wins in a row"
 * - "💀 Man United haven't beaten Liverpool in 7 matches"
 * - "⚽ This fixture averages 3.4 goals per match"
 */

'use client';

import { MatchHeadline } from '@/types';

interface MatchHeadlinesCardProps {
  headlines: MatchHeadline[];
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
}

const categoryColors: Record<MatchHeadline['category'], string> = {
  streak: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
  h2h: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  form: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  goals: 'bg-green-500/20 border-green-500/30 text-green-400',
  defense: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  timing: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  absence: 'bg-red-500/20 border-red-500/30 text-red-400',
  venue: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
  motivation: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
};

const impactGlow: Record<MatchHeadline['impactLevel'], string> = {
  low: '',
  medium: 'shadow-sm',
  high: 'shadow-md ring-1 ring-white/10',
};

export default function MatchHeadlinesCard({ 
  headlines, 
  homeTeam, 
  awayTeam, 
  compact = false 
}: MatchHeadlinesCardProps) {
  if (!headlines || headlines.length === 0) {
    return null;
  }

  // Sort by impact level (high first)
  const sortedHeadlines = [...headlines].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impactLevel] - order[b.impactLevel];
  });

  const displayHeadlines = compact ? sortedHeadlines.slice(0, 3) : sortedHeadlines;

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📰</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Match Headlines</h3>
            <p className="text-xs text-text-muted">Key facts you need to know</p>
          </div>
        </div>
      </div>

      {/* Headlines List */}
      <div className="p-4 space-y-3">
        {displayHeadlines.map((headline, index) => (
          <HeadlineItem key={index} headline={headline} />
        ))}
      </div>

      {/* Show more button if compact */}
      {compact && headlines.length > 3 && (
        <div className="px-4 pb-4">
          <button className="w-full py-2 text-xs text-text-muted hover:text-text-secondary transition-colors">
            +{headlines.length - 3} more insights
          </button>
        </div>
      )}

      {/* Share hint */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Tap any headline to copy & share</span>
        </div>
      </div>
    </div>
  );
}

function HeadlineItem({ headline }: { headline: MatchHeadline }) {
  const colorClass = categoryColors[headline.category];
  const glowClass = impactGlow[headline.impactLevel];

  const handleCopy = () => {
    navigator.clipboard.writeText(`${headline.icon} ${headline.text}`);
    // Could add toast notification here
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        w-full text-left p-3 rounded-xl border transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        ${colorClass} ${glowClass}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{headline.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-relaxed">
            {headline.text}
          </p>
          {headline.impactLevel === 'high' && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/10 rounded text-[10px] uppercase tracking-wider text-white/60">
              Key Insight
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Compact inline version for quick display
 */
export function MatchHeadlinesInline({ headlines }: { headlines: MatchHeadline[] }) {
  if (!headlines || headlines.length === 0) return null;

  const topHeadlines = headlines
    .filter(h => h.impactLevel === 'high')
    .slice(0, 2);

  if (topHeadlines.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {topHeadlines.map((h, i) => (
        <span 
          key={i}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${categoryColors[h.category]}`}
        >
          <span>{h.icon}</span>
          <span className="truncate max-w-[200px]">{h.text}</span>
        </span>
      ))}
    </div>
  );
}
