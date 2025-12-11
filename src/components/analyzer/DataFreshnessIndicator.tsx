/**
 * Data Freshness Indicator Component
 * 
 * Shows the recency and source of data used in analysis.
 * Helps users understand data quality and timeliness.
 * 
 * Features:
 * - Live/Recent/Stale status badges
 * - Data source attribution
 * - Refresh timestamp
 */

'use client';

interface DataFreshnessProps {
  dataSource?: 'API_FOOTBALL' | 'API_SPORTS' | 'AI_ESTIMATE' | 'UNAVAILABLE' | string;
  analysisTime?: string;
  compact?: boolean;
}

export default function DataFreshnessIndicator({
  dataSource = 'AI_ESTIMATE',
  analysisTime,
  compact = false,
}: DataFreshnessProps) {
  // Determine freshness based on data source
  const getFreshnessInfo = () => {
    switch (dataSource) {
      case 'API_FOOTBALL':
      case 'API_SPORTS':
        return {
          status: 'live',
          label: 'Live Data',
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          icon: '🟢',
          description: 'Real-time statistics from API-Sports',
        };
      case 'AI_ESTIMATE':
        return {
          status: 'estimated',
          label: 'AI Estimated',
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          icon: '🤖',
          description: 'AI-generated estimates based on available information',
        };
      case 'UNAVAILABLE':
        return {
          status: 'unavailable',
          label: 'Limited Data',
          color: 'text-text-muted',
          bgColor: 'bg-bg-hover',
          borderColor: 'border-divider',
          icon: '⚠️',
          description: 'Historical data not available for this matchup',
        };
      default:
        return {
          status: 'unknown',
          label: 'Mixed Sources',
          color: 'text-info',
          bgColor: 'bg-info/10',
          borderColor: 'border-info/20',
          icon: '📊',
          description: 'Data from multiple sources',
        };
    }
  };

  const freshness = getFreshnessInfo();

  // Format analysis time
  const formatTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const timeAgo = formatTime(analysisTime);

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-chip text-[10px] font-medium ${freshness.bgColor} ${freshness.borderColor} border`}
        title={freshness.description}
      >
        <span>{freshness.icon}</span>
        <span className={freshness.color}>{freshness.label}</span>
        {timeAgo && (
          <>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">{timeAgo}</span>
          </>
        )}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${freshness.bgColor} ${freshness.borderColor} border`}>
      <span className="text-lg">{freshness.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${freshness.color}`}>{freshness.label}</span>
          {timeAgo && (
            <span className="text-xs text-text-muted">• {timeAgo}</span>
          )}
        </div>
        <p className="text-[10px] text-text-muted truncate">{freshness.description}</p>
      </div>
    </div>
  );
}

// Confidence score component based on data quality
interface DataConfidenceProps {
  score: number; // 0-100
  factors?: string[];
}

export function DataConfidenceBadge({ score, factors = [] }: DataConfidenceProps) {
  const getConfidenceLevel = (s: number) => {
    if (s >= 80) return { label: 'High', color: 'text-success', bg: 'bg-success/10' };
    if (s >= 60) return { label: 'Good', color: 'text-info', bg: 'bg-info/10' };
    if (s >= 40) return { label: 'Fair', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Low', color: 'text-danger', bg: 'bg-danger/10' };
  };

  const level = getConfidenceLevel(score);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${level.bg}`}>
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-divider"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"
          />
          <path
            className={level.color}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${score}, 100`}
            d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${level.color}`}>
          {score}
        </span>
      </div>
      <div>
        <p className={`text-xs font-medium ${level.color}`}>{level.label} Confidence</p>
        {factors.length > 0 && (
          <p className="text-[9px] text-text-muted">
            {factors.slice(0, 2).join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
}
