/**
 * Key Metrics Grid Component
 * 
 * Compact grid of key analysis metrics.
 * Perfect for at-a-glance summary information.
 * 
 * Features:
 * - 2x2 or 3x2 responsive grid
 * - Color-coded metric values
 * - Icon support
 * - Compact mobile-first design
 */

'use client';

interface Metric {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';
  subValue?: string;
  tooltip?: string;
}

interface KeyMetricsGridProps {
  metrics: Metric[];
  columns?: 2 | 3;
  compact?: boolean;
}

const colorClasses = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  accent: 'text-accent',
  muted: 'text-text-muted',
};

const bgClasses = {
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  danger: 'bg-danger/10',
  info: 'bg-info/10',
  accent: 'bg-accent/10',
  muted: 'bg-bg-hover',
};

export default function KeyMetricsGrid({
  metrics,
  columns = 2,
  compact = false,
}: KeyMetricsGridProps) {
  const gridCols = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const padding = compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4';
  const valueSize = compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';
  const labelSize = compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs';

  return (
    <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`
            rounded-lg border border-divider ${padding}
            ${bgClasses[metric.color || 'muted']}
            transition-all duration-200 hover:border-${metric.color || 'divider'}/40
          `}
          title={metric.tooltip}
        >
          {/* Icon + Label */}
          <div className="flex items-center gap-1.5 mb-1">
            {metric.icon && (
              <span className="text-sm flex-shrink-0">{metric.icon}</span>
            )}
            <span className={`${labelSize} text-text-muted uppercase tracking-wider font-medium truncate`}>
              {metric.label}
            </span>
          </div>
          
          {/* Value */}
          <div className={`${valueSize} font-bold ${colorClasses[metric.color || 'muted']}`}>
            {metric.value}
          </div>
          
          {/* Sub Value */}
          {metric.subValue && (
            <div className={`${labelSize} text-text-muted mt-0.5`}>
              {metric.subValue}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Pre-built variant for match analysis summary
interface AnalysisSummaryMetricsProps {
  homeWinProb: number;
  awayWinProb: number;
  drawProb?: number | null;
  confidenceLevel: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  valueFound: boolean;
}

export function AnalysisSummaryMetrics({
  homeWinProb,
  awayWinProb,
  drawProb,
  confidenceLevel,
  riskLevel,
  valueFound,
}: AnalysisSummaryMetricsProps) {
  const riskColors: Record<string, 'success' | 'warning' | 'danger'> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
  };

  const metrics: Metric[] = [
    {
      label: 'Home Win',
      value: `${homeWinProb}%`,
      icon: '🏠',
      color: homeWinProb >= 50 ? 'success' : 'muted',
    },
    {
      label: 'Away Win',
      value: `${awayWinProb}%`,
      icon: '✈️',
      color: awayWinProb >= 50 ? 'info' : 'muted',
    },
  ];

  if (drawProb !== null && drawProb !== undefined) {
    metrics.push({
      label: 'Draw',
      value: `${drawProb}%`,
      icon: '🤝',
      color: drawProb >= 30 ? 'warning' : 'muted',
    });
  }

  metrics.push(
    {
      label: 'Confidence',
      value: `${confidenceLevel}%`,
      icon: '🎯',
      color: confidenceLevel >= 70 ? 'success' : confidenceLevel >= 50 ? 'warning' : 'danger',
    },
    {
      label: 'Risk Level',
      value: riskLevel,
      icon: '⚠️',
      color: riskColors[riskLevel],
    },
    {
      label: 'Value',
      value: valueFound ? 'Found' : 'None',
      icon: '💎',
      color: valueFound ? 'accent' : 'muted',
    }
  );

  return <KeyMetricsGrid metrics={metrics} columns={3} compact />;
}
