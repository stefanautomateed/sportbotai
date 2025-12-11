/**
 * Match Countdown Timer Component
 * 
 * Real-time countdown to match kickoff.
 * Features:
 * - Live updating countdown
 * - Responsive compact/full display
 * - Visual urgency indicators
 * - "LIVE" badge when match started
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

interface MatchCountdownProps {
  matchDate: string;
  compact?: boolean;
  showLabel?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function MatchCountdown({
  matchDate,
  compact = false,
  showLabel = true,
}: MatchCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Parse target date
  const targetDate = useMemo(() => new Date(matchDate), [matchDate]);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsLive(true);
        setTimeRemaining(null);
        return;
      }

      setIsLive(false);
      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff,
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Get urgency level
  const getUrgencyLevel = () => {
    if (!timeRemaining) return 'live';
    const hoursRemaining = timeRemaining.total / (1000 * 60 * 60);
    if (hoursRemaining < 1) return 'imminent';
    if (hoursRemaining < 6) return 'soon';
    if (hoursRemaining < 24) return 'today';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  // Urgency-based styling
  const urgencyStyles = {
    live: 'bg-danger/20 border-danger/30 text-danger',
    imminent: 'bg-warning/20 border-warning/30 text-warning',
    soon: 'bg-accent/20 border-accent/30 text-accent',
    today: 'bg-info/20 border-info/30 text-info',
    normal: 'bg-bg-hover border-divider text-text-secondary',
  };

  // Compact version (inline badge)
  if (compact) {
    if (isLive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-chip bg-danger/20 border border-danger/30">
          <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-danger uppercase">Live</span>
        </span>
      );
    }

    if (!timeRemaining) return null;

    // Show most relevant unit
    if (timeRemaining.days > 0) {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-chip text-[10px] font-medium ${urgencyStyles[urgency]} border`}>
          {timeRemaining.days}d {timeRemaining.hours}h
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-chip text-[10px] font-medium ${urgencyStyles[urgency]} border`}>
        {String(timeRemaining.hours).padStart(2, '0')}:{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
      </span>
    );
  }

  // Full version
  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${urgencyStyles[urgency]}`}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wider">
            {isLive ? 'Match Status' : 'Kickoff In'}
          </span>
        </div>
      )}

      {isLive ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
          <span className="text-lg sm:text-xl font-bold">LIVE NOW</span>
        </div>
      ) : timeRemaining ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Days */}
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none">
              {String(timeRemaining.days).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Days</div>
          </div>
          
          {/* Hours */}
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none">
              {String(timeRemaining.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Hrs</div>
          </div>
          
          {/* Minutes */}
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Min</div>
          </div>
          
          {/* Seconds */}
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-none animate-pulse">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted mt-1">Sec</div>
          </div>
        </div>
      ) : null}

      {/* Urgency Message */}
      {!isLive && urgency !== 'normal' && (
        <div className="mt-3 pt-3 border-t border-current/20 text-xs font-medium">
          {urgency === 'imminent' && '⚡ Starting very soon!'}
          {urgency === 'soon' && '🔔 Starting in a few hours'}
          {urgency === 'today' && '📅 Match is today'}
        </div>
      )}
    </div>
  );
}
