/**
 * Stat Comparison Bar Component
 * 
 * Animated horizontal bar comparison between two values.
 * Perfect for head-to-head stat comparisons.
 * 
 * Features:
 * - Animated width transitions
 * - Color-coded advantage indicator
 * - Responsive sizing
 * - Tooltip support
 */

'use client';

import { useMemo } from 'react';

interface StatComparisonBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  homeLabel?: string;
  awayLabel?: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'decimal';
  showValues?: boolean;
  compact?: boolean;
}

export default function StatComparisonBar({
  label,
  homeValue,
  awayValue,
  homeLabel,
  awayLabel,
  unit = '',
  format = 'number',
  showValues = true,
  compact = false,
}: StatComparisonBarProps) {
  // Calculate percentages for bar widths
  const { homePercent, awayPercent, homeAdvantage } = useMemo(() => {
    const total = homeValue + awayValue;
    if (total === 0) return { homePercent: 50, awayPercent: 50, homeAdvantage: null };
    
    const homeP = (homeValue / total) * 100;
    const awayP = (awayValue / total) * 100;
    
    // Determine advantage
    let advantage: 'home' | 'away' | null = null;
    if (homeValue > awayValue * 1.1) advantage = 'home';
    else if (awayValue > homeValue * 1.1) advantage = 'away';
    
    return { homePercent: homeP, awayPercent: awayP, homeAdvantage: advantage };
  }, [homeValue, awayValue]);

  // Format value for display
  const formatValue = (value: number): string => {
    switch (format) {
      case 'percentage':
        return `${Math.round(value)}%`;
      case 'decimal':
        return value.toFixed(1);
      default:
        return String(Math.round(value));
    }
  };

  const barHeight = compact ? 'h-1.5' : 'h-2.5';
  const textSize = compact ? 'text-[10px]' : 'text-xs';
  const valueSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="w-full">
      {/* Label Row */}
      <div className="flex items-center justify-between mb-1.5">
        {showValues && (
          <span className={`${valueSize} font-bold ${homeAdvantage === 'home' ? 'text-success' : 'text-text-primary'}`}>
            {formatValue(homeValue)}{unit}
          </span>
        )}
        <span className={`${textSize} text-text-muted font-medium flex-1 text-center mx-2`}>
          {label}
        </span>
        {showValues && (
          <span className={`${valueSize} font-bold ${homeAdvantage === 'away' ? 'text-info' : 'text-text-primary'}`}>
            {formatValue(awayValue)}{unit}
          </span>
        )}
      </div>
      
      {/* Bar Container */}
      <div className="flex items-center gap-0.5">
        {/* Home Bar (right-aligned, grows left) */}
        <div className="flex-1 flex justify-end">
          <div
            className={`${barHeight} rounded-l-full transition-all duration-700 ease-out ${
              homeAdvantage === 'home' 
                ? 'bg-gradient-to-r from-success/50 to-success' 
                : 'bg-gradient-to-r from-success/30 to-success/60'
            }`}
            style={{ width: `${Math.max(homePercent, 5)}%` }}
          />
        </div>
        
        {/* Center Divider */}
        <div className={`w-0.5 ${barHeight} bg-divider flex-shrink-0`} />
        
        {/* Away Bar (left-aligned, grows right) */}
        <div className="flex-1">
          <div
            className={`${barHeight} rounded-r-full transition-all duration-700 ease-out ${
              homeAdvantage === 'away' 
                ? 'bg-gradient-to-l from-info/50 to-info' 
                : 'bg-gradient-to-l from-info/30 to-info/60'
            }`}
            style={{ width: `${Math.max(awayPercent, 5)}%` }}
          />
        </div>
      </div>
      
      {/* Team Labels (optional) */}
      {(homeLabel || awayLabel) && (
        <div className="flex items-center justify-between mt-1">
          <span className={`${textSize} text-text-muted truncate max-w-[40%]`}>
            {homeLabel}
          </span>
          <span className={`${textSize} text-text-muted truncate max-w-[40%] text-right`}>
            {awayLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// Pre-built comparison component for multiple stats
interface MultiStatComparisonProps {
  stats: {
    label: string;
    home: number;
    away: number;
    unit?: string;
    format?: 'number' | 'percentage' | 'decimal';
  }[];
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
}

export function MultiStatComparison({ stats, homeTeam, awayTeam, compact = false }: MultiStatComparisonProps) {
  return (
    <div className="space-y-4">
      {/* Team Headers */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs sm:text-sm font-semibold text-success truncate max-w-[35%]">
          {homeTeam}
        </span>
        <span className="text-[10px] text-text-muted">vs</span>
        <span className="text-xs sm:text-sm font-semibold text-info truncate max-w-[35%] text-right">
          {awayTeam}
        </span>
      </div>
      
      {/* Stats */}
      <div className="space-y-3">
        {stats.map((stat) => (
          <StatComparisonBar
            key={stat.label}
            label={stat.label}
            homeValue={stat.home}
            awayValue={stat.away}
            unit={stat.unit}
            format={stat.format}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
