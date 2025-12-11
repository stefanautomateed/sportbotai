/**
 * Quick Analysis Button Component
 * 
 * Premium one-click analysis button for MatchPreview.
 * Features:
 * - Loading state with progress animation
 * - Success/Error feedback
 * - Keyboard accessible
 * - Touch-optimized
 */

'use client';

import { useState, useEffect } from 'react';

interface QuickAnalyzeButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  hasOdds?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuickAnalyzeButton({
  onClick,
  loading = false,
  disabled = false,
  hasOdds = true,
  size = 'lg',
}: QuickAnalyzeButtonProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Animate progress when loading
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setStatusText('');
      return;
    }

    setStatusText('Fetching match data...');
    const stages = [
      { progress: 20, text: 'Fetching match data...', delay: 0 },
      { progress: 40, text: 'Loading team statistics...', delay: 1500 },
      { progress: 60, text: 'Running AI analysis...', delay: 3000 },
      { progress: 80, text: 'Calculating probabilities...', delay: 5000 },
      { progress: 95, text: 'Finalizing report...', delay: 8000 },
    ];

    const timers = stages.map(({ progress, text, delay }) =>
      setTimeout(() => {
        setProgress(progress);
        setStatusText(text);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Size variants
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="w-full">
      <button
        onClick={onClick}
        disabled={disabled || loading || !hasOdds}
        className={`
          relative w-full font-bold rounded-btn
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-card
          ${sizeClasses[size]}
          ${disabled || !hasOdds
            ? 'bg-divider text-text-muted cursor-not-allowed'
            : loading
            ? 'bg-accent/80 text-primary-900'
            : 'bg-gradient-to-r from-accent to-accent-dark text-primary-900 hover:shadow-lg hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]'
          }
          overflow-hidden
        `}
      >
        {/* Progress Bar Background */}
        {loading && (
          <div
            className="absolute inset-0 bg-accent/30 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}

        {/* Button Content */}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              {/* Loading Spinner */}
              <svg className={`${iconSizes[size]} animate-spin`} fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : !hasOdds ? (
            <>
              <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Waiting for Odds</span>
            </>
          ) : (
            <>
              {/* AI Icon */}
              <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Run AI Analysis</span>
              
              {/* Sparkle Effect */}
              <span className="absolute -top-1 -right-1">
                <svg className="w-4 h-4 text-warning animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
            </>
          )}
        </span>
      </button>

      {/* Loading Status Text */}
      {loading && statusText && (
        <div className="mt-3 text-center">
          <p className="text-xs text-text-muted animate-pulse">{statusText}</p>
          <div className="mt-2 h-1 w-full bg-divider rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Helper text when no odds */}
      {!hasOdds && !loading && (
        <p className="mt-2 text-center text-[10px] text-text-muted">
          Select a match with odds to analyze
        </p>
      )}
    </div>
  );
}
