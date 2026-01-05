/**
 * Match List Item Component
 * 
 * Clean, data-table style match row for lists.
 * Inspired by sports-ai.dev prediction tables.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TeamLogo from './TeamLogo';
import LeagueLogo from './LeagueLogo';
import { generateMatchSlug } from '@/lib/match-utils';

interface MatchListItemProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sportKey: string;
  commenceTime: string;
  homeProb?: number;
  drawProb?: number;
  awayProb?: number;
  isHot?: boolean;
  className?: string;
}

export default function MatchListItem({
  homeTeam,
  awayTeam,
  league,
  sportKey,
  commenceTime,
  homeProb,
  drawProb,
  awayProb,
  isHot = false,
  className = '',
}: MatchListItemProps) {
  // Generate clean, SEO-friendly URL slug
  const matchSlug = generateMatchSlug(homeTeam, awayTeam, sportKey, commenceTime);

  // Format time until match - use state to avoid hydration mismatch
  const [timeDisplay, setTimeDisplay] = useState({ text: '', isUrgent: false });
  
  useEffect(() => {
    const calculateTime = () => {
      const matchDate = new Date(commenceTime);
      const now = new Date();
      const diffMs = matchDate.getTime() - now.getTime();
      
      if (diffMs < 0) return { text: 'LIVE', isUrgent: true };
      
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 60) return { text: `${minutes}m`, isUrgent: true };
      if (hours < 24) return { text: `${hours}h ${minutes % 60}m`, isUrgent: hours < 3 };
      return { text: `${days}d ${hours % 24}h`, isUrgent: false };
    };
    
    setTimeDisplay(calculateTime());
    // Update every minute
    const interval = setInterval(() => setTimeDisplay(calculateTime()), 60000);
    return () => clearInterval(interval);
  }, [commenceTime]);
  const hasDraw = drawProb !== undefined && drawProb !== null;

  return (
    <Link
      href={`/match/${matchSlug}`}
      className={`
        group flex items-center gap-4 px-4 py-3 
        bg-bg-card hover:bg-bg-elevated 
        border-b border-white/5 last:border-b-0
        transition-all duration-200
        ${className}
      `}
    >
      {/* League & Sport */}
      <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
        <LeagueLogo leagueName={league} sport={sportKey} size="sm" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400 truncate">{league}</p>
        </div>
      </div>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamLogo teamName={homeTeam} sport={sportKey} league={league} size="sm" />
            <span className="text-sm font-medium text-white truncate">{homeTeam}</span>
          </div>
          
          {/* Away */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-medium text-white truncate text-right">{awayTeam}</span>
            <TeamLogo teamName={awayTeam} sport={sportKey} league={league} size="sm" />
          </div>
        </div>
      </div>

      {/* Probabilities - if available */}
      {(homeProb !== undefined) && (
        <div className="hidden sm:flex items-center gap-2 w-[120px] justify-end flex-shrink-0">
          <span className={`text-xs font-semibold tabular-nums w-9 text-center ${homeProb > (awayProb || 0) ? 'text-blue-400' : 'text-gray-500'}`}>
            {homeProb}%
          </span>
          {hasDraw && (
            <span className="text-xs font-semibold tabular-nums w-9 text-center text-gray-500">
              {drawProb}%
            </span>
          )}
          <span className={`text-xs font-semibold tabular-nums w-9 text-center ${(awayProb || 0) > homeProb ? 'text-emerald-400' : 'text-gray-500'}`}>
            {awayProb}%
          </span>
        </div>
      )}

      {/* Time */}
      <div className="flex items-center gap-2 w-[80px] justify-end flex-shrink-0">
        {isHot && (
          <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded text-white font-bold">
            HOT
          </span>
        )}
        <span className={`
          text-xs font-medium px-2 py-1 rounded-md
          ${timeDisplay.isUrgent 
            ? 'bg-orange-500/15 text-orange-400' 
            : 'bg-white/5 text-gray-400'}
        `}>
          {timeDisplay.text}
        </span>
      </div>

      {/* Arrow */}
      <svg 
        className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" 
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

/**
 * Match List Container
 */
interface MatchListProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  className?: string;
}

export function MatchList({ 
  children, 
  title, 
  subtitle,
  showHeader = true,
  className = '' 
}: MatchListProps) {
  return (
    <div className={`bg-bg-card rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {showHeader && title && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      
      {/* Table Header */}
      <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
        <div className="w-[140px]">League</div>
        <div className="flex-1">Match</div>
        <div className="w-[120px] text-right">H / D / A</div>
        <div className="w-[80px] text-right">Time</div>
        <div className="w-4"></div>
      </div>
      
      <div className="divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}
