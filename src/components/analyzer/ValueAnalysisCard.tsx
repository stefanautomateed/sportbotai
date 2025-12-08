/**
 * Value Analysis Card Component
 * 
 * Displays analysis.valueAnalysis with implied probabilities,
 * value flags, best value side, and expandable detailed comment.
 */

'use client';

import { useState } from 'react';
import { ValueAnalysis, ValueFlag, BestValueSide } from '@/types';

interface ValueAnalysisCardProps {
  valueAnalysis: ValueAnalysis;
}

const valueFlagConfig: Record<ValueFlag, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  NONE: { label: 'No Value', bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
  LOW: { label: 'Low Value', bgColor: 'bg-accent-cyan/10', textColor: 'text-accent-cyan', borderColor: 'border-accent-cyan/30' },
  MEDIUM: { label: 'Medium Value', bgColor: 'bg-accent-lime/10', textColor: 'text-accent-lime', borderColor: 'border-accent-lime/30' },
  HIGH: { label: 'High Value', bgColor: 'bg-accent-green/10', textColor: 'text-accent-green', borderColor: 'border-accent-green/30' },
};

const bestValueSideConfig: Record<BestValueSide, { label: string; color: string }> = {
  HOME: { label: 'Home Win', color: 'text-accent-green' },
  DRAW: { label: 'Draw', color: 'text-gray-600' },
  AWAY: { label: 'Away Win', color: 'text-accent-cyan' },
  NONE: { label: 'No Clear Value', color: 'text-gray-500' },
};

interface ValueFlagBadgeProps {
  label: string;
  impliedProb: number | null;
  flag: ValueFlag;
}

function ValueFlagBadge({ label, impliedProb, flag }: ValueFlagBadgeProps) {
  const config = valueFlagConfig[flag];
  
  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-800">
        {impliedProb !== null ? `${impliedProb.toFixed(1)}%` : 'N/A'}
      </p>
      <span className={`inline-block mt-1 text-xs font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

export default function ValueAnalysisCard({ valueAnalysis }: ValueAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bestValueConfig = bestValueSideConfig[valueAnalysis.bestValueSide];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-xl">💰</span>
        Value Analysis
      </h3>

      {/* Implied Probabilities with Value Flags */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <ValueFlagBadge
          label="Home Win"
          impliedProb={valueAnalysis.impliedProbabilities.homeWin}
          flag={valueAnalysis.valueFlags.homeWin}
        />
        <ValueFlagBadge
          label="Draw"
          impliedProb={valueAnalysis.impliedProbabilities.draw}
          flag={valueAnalysis.valueFlags.draw}
        />
        <ValueFlagBadge
          label="Away Win"
          impliedProb={valueAnalysis.impliedProbabilities.awayWin}
          flag={valueAnalysis.valueFlags.awayWin}
        />
      </div>

      {/* Best Value Side */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Best Value Side:</span>
          <span className={`font-bold ${bestValueConfig.color}`}>
            {valueAnalysis.bestValueSide !== 'NONE' ? (
              <>
                <span className="text-lg mr-1">
                  {valueAnalysis.bestValueSide === 'HOME' ? '🏠' : 
                   valueAnalysis.bestValueSide === 'AWAY' ? '✈️' : '🤝'}
                </span>
                {bestValueConfig.label}
              </>
            ) : (
              bestValueConfig.label
            )}
          </span>
        </div>
      </div>

      {/* Short Comment (always visible) */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {valueAnalysis.valueCommentShort}
        </p>
      </div>

      {/* Expandable Detailed Comment */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors"
        >
          <span className="font-medium">
            {isExpanded ? 'Hide detailed analysis' : 'Show detailed analysis'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">
              {valueAnalysis.valueCommentDetailed}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
