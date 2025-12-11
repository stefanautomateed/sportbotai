/**
 * Form Timeline Component
 * 
 * Visual timeline representation of recent match results.
 * Shows W/D/L with tooltips for match details.
 * 
 * Features:
 * - Connected timeline dots
 * - Color-coded results
 * - Hover tooltips with match details
 * - Recent form summary stats
 */

'use client';

import { FormMatch } from '@/types';
import { useMemo } from 'react';

interface FormTimelineProps {
  form: FormMatch[];
  teamName: string;
  maxMatches?: number;
  showStats?: boolean;
  layout?: 'horizontal' | 'vertical';
}

// Result color mapping
const RESULT_COLORS = {
  W: { bg: 'bg-success', text: 'text-success', border: 'border-success' },
  D: { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' },
  L: { bg: 'bg-danger', text: 'text-danger', border: 'border-danger' },
};

export default function FormTimeline({
  form,
  teamName,
  maxMatches = 5,
  showStats = true,
  layout = 'horizontal',
}: FormTimelineProps) {
  const displayForm = form.slice(0, maxMatches);
  
  // Calculate form statistics
  const stats = useMemo(() => {
    const wins = form.filter(m => m.result === 'W').length;
    const draws = form.filter(m => m.result === 'D').length;
    const losses = form.filter(m => m.result === 'L').length;
    const total = form.length;
    
    // Calculate points (3 for win, 1 for draw)
    const points = wins * 3 + draws;
    const maxPoints = total * 3;
    const formRating = total > 0 ? Math.round((points / maxPoints) * 100) : 0;
    
    // Get form string (e.g., "WWDLW")
    const formString = form.slice(0, 5).map(m => m.result).join('');
    
    return { wins, draws, losses, total, points, formRating, formString };
  }, [form]);

  // Get form rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 70) return 'text-success';
    if (rating >= 40) return 'text-warning';
    return 'text-danger';
  };

  if (form.length === 0) {
    return (
      <div className="text-center py-3 text-text-muted text-xs">
        No recent form data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Team Header with Form Rating */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-text-secondary truncate max-w-[60%]">
          {teamName}
        </span>
        {showStats && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">Form Rating:</span>
            <span className={`text-sm font-bold ${getRatingColor(stats.formRating)}`}>
              {stats.formRating}%
            </span>
          </div>
        )}
      </div>
      
      {/* Timeline */}
      {layout === 'horizontal' ? (
        <div className="flex items-center gap-1">
          {displayForm.map((match, index) => {
            const colors = RESULT_COLORS[match.result];
            const isLatest = index === 0;
            
            return (
              <div key={index} className="relative group flex-1 min-w-0">
                {/* Connecting Line */}
                {index < displayForm.length - 1 && (
                  <div className="absolute top-1/2 left-1/2 right-0 h-0.5 bg-divider -translate-y-1/2" />
                )}
                
                {/* Result Dot/Badge */}
                <div
                  className={`
                    relative z-10 mx-auto flex items-center justify-center
                    transition-all duration-200 group-hover:scale-110
                    ${isLatest ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-6 h-6 sm:w-7 sm:h-7'}
                    ${colors.bg}/20 ${colors.border} border
                    rounded-full
                  `}
                >
                  <span className={`text-[10px] sm:text-xs font-bold ${colors.text}`}>
                    {match.result}
                  </span>
                </div>
                
                {/* Tooltip on Hover */}
                {(match.opponent || match.score) && (
                  <div className="
                    absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                    bg-bg-card border border-divider rounded-lg shadow-lg
                    px-3 py-2 text-xs
                    opacity-0 group-hover:opacity-100
                    pointer-events-none
                    transition-opacity duration-200
                    whitespace-nowrap z-20
                  ">
                    <div className="text-text-primary font-medium">
                      {match.home ? 'vs' : '@'} {match.opponent || 'Unknown'}
                    </div>
                    {match.score && (
                      <div className="text-text-muted mt-0.5">{match.score}</div>
                    )}
                    {match.date && (
                      <div className="text-text-muted text-[10px] mt-1">{match.date}</div>
                    )}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-bg-card" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Vertical Layout */
        <div className="space-y-2">
          {displayForm.map((match, index) => {
            const colors = RESULT_COLORS[match.result];
            
            return (
              <div
                key={index}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  ${colors.bg}/10 border ${colors.border}/20
                `}
              >
                <span className={`w-6 h-6 flex items-center justify-center rounded-full ${colors.bg}/30`}>
                  <span className={`text-xs font-bold ${colors.text}`}>{match.result}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary truncate">
                    {match.home ? 'vs' : '@'} {match.opponent || 'Unknown'}
                  </div>
                  {match.score && (
                    <div className="text-[10px] text-text-muted">{match.score}</div>
                  )}
                </div>
                {match.date && (
                  <span className="text-[10px] text-text-muted flex-shrink-0">{match.date}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Form Stats Summary */}
      {showStats && (
        <div className="flex items-center justify-between pt-2 border-t border-divider">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-success/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-success">W</span>
              </span>
              <span className="text-xs text-text-secondary">{stats.wins}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-warning/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-warning">D</span>
              </span>
              <span className="text-xs text-text-secondary">{stats.draws}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-danger/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-danger">L</span>
              </span>
              <span className="text-xs text-text-secondary">{stats.losses}</span>
            </div>
          </div>
          <div className="text-[10px] text-text-muted">
            Last {stats.total} games
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline form display
interface FormBadgesCompactProps {
  form: FormMatch[];
  maxMatches?: number;
}

export function FormBadgesCompact({ form, maxMatches = 5 }: FormBadgesCompactProps) {
  if (!form || form.length === 0) return null;
  
  return (
    <div className="flex items-center gap-0.5">
      {form.slice(0, maxMatches).map((match, i) => {
        const colors = RESULT_COLORS[match.result];
        return (
          <span
            key={i}
            className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold ${colors.bg}/20 ${colors.text}`}
          >
            {match.result}
          </span>
        );
      })}
    </div>
  );
}
