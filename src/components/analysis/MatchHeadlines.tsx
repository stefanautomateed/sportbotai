/**
 * Match Headlines Component
 * 
 * 3-4 shareable one-liner facts about the match.
 * These are the "Did You Know?" viral stats people screenshot.
 */

'use client';

interface Headline {
  icon: string;
  text: string;
  /** Which team this benefits, if any */
  favors?: 'home' | 'away' | 'neutral';
  /** Is this particularly shocking/shareable? */
  viral?: boolean;
}

interface MatchHeadlinesProps {
  headlines: Headline[];
  homeTeam: string;
  awayTeam: string;
}

export default function MatchHeadlines({
  headlines,
  homeTeam,
  awayTeam,
}: MatchHeadlinesProps) {
  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Did You Know?</h3>
            <p className="text-xs text-text-muted">Key facts about this fixture</p>
          </div>
        </div>
        <span className="text-xs text-text-muted">{headlines.length} insights</span>
      </div>

      {/* Headlines List */}
      <div className="divide-y divide-white/5">
        {headlines.map((headline, index) => (
          <div 
            key={index}
            className={`px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors ${
              headline.viral ? 'bg-gradient-to-r from-accent/5 to-transparent' : ''
            }`}
          >
            {/* Icon */}
            <span className="text-2xl flex-shrink-0">{headline.icon}</span>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white leading-relaxed">
                {headline.text}
              </p>
              
              {/* Favors tag */}
              {headline.favors && headline.favors !== 'neutral' && (
                <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-medium ${
                  headline.favors === 'home' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-blue-500/10 text-blue-400'
                }`}>
                  <span>{headline.favors === 'home' ? '↑' : '↓'}</span>
                  Favors {headline.favors === 'home' ? homeTeam : awayTeam}
                </span>
              )}
            </div>

            {/* Viral badge */}
            {headline.viral && (
              <span className="flex-shrink-0 px-2 py-1 bg-accent/20 text-accent text-[10px] font-bold rounded uppercase">
                🔥 Hot
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
