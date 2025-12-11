/**
 * Probability Donut Chart Component
 * 
 * Beautiful animated donut chart for displaying probability distribution.
 * Features:
 * - SVG-based donut chart with smooth animations
 * - Center stat display
 * - Responsive design
 * - Color-coded segments
 */

'use client';

import { useMemo } from 'react';

interface ProbabilityDonutProps {
  homeWin: number;
  draw: number | null;
  awayWin: number;
  homeTeam: string;
  awayTeam: string;
  size?: number;
  className?: string;
}

export default function ProbabilityDonut({
  homeWin,
  draw,
  awayWin,
  homeTeam,
  awayTeam,
  size = 200,
  className = '',
}: ProbabilityDonutProps) {
  const hasDraw = draw !== null && draw > 0;
  
  // Calculate percentages and segments
  const segments = useMemo(() => {
    const total = homeWin + (draw || 0) + awayWin;
    if (total === 0) return [];
    
    const result = [
      { value: homeWin, color: '#22C55E', label: 'Home', team: homeTeam },
    ];
    
    if (hasDraw) {
      result.push({ value: draw!, color: '#64748B', label: 'Draw', team: 'Draw' });
    }
    
    result.push({ value: awayWin, color: '#38BDF8', label: 'Away', team: awayTeam });
    
    return result;
  }, [homeWin, draw, awayWin, hasDraw, homeTeam, awayTeam]);

  // Find the dominant outcome
  const dominant = useMemo(() => {
    if (hasDraw && draw! >= homeWin && draw! >= awayWin) {
      return { value: draw!, label: 'Draw', color: '#64748B' };
    }
    if (homeWin >= awayWin) {
      return { value: homeWin, label: homeTeam, color: '#22C55E' };
    }
    return { value: awayWin, label: awayTeam, color: '#38BDF8' };
  }, [homeWin, draw, awayWin, hasDraw, homeTeam, awayTeam]);

  // SVG calculations
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke dash arrays for each segment
  const segmentData = useMemo(() => {
    let cumulativeOffset = 0;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    
    return segments.map((segment) => {
      const percentage = segment.value / total;
      const dashLength = percentage * circumference;
      const dashArray = `${dashLength} ${circumference - dashLength}`;
      const rotation = (cumulativeOffset * 360) - 90; // Start from top
      cumulativeOffset += percentage;
      
      return {
        ...segment,
        dashArray,
        rotation,
        percentage: Math.round(segment.value),
      };
    });
  }, [segments, circumference]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* SVG Donut */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform transition-all duration-500"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        
        {/* Segments */}
        {segmentData.map((segment, index) => (
          <circle
            key={segment.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.dashArray}
            strokeLinecap="round"
            transform={`rotate(${segment.rotation} ${center} ${center})`}
            className="transition-all duration-700 ease-out"
            style={{
              animationDelay: `${index * 150}ms`,
              opacity: 0.9,
            }}
          />
        ))}
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <span className="text-2xl sm:text-3xl font-bold text-text-primary">
          {dominant.value}%
        </span>
        <span className="text-[10px] sm:text-xs text-text-muted mt-0.5 max-w-[80%] truncate">
          {dominant.label}
        </span>
      </div>
      
      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 sm:gap-4">
        {segmentData.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[10px] sm:text-xs text-text-muted">
              {segment.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
