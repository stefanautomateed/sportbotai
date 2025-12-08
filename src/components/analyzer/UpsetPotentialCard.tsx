/**
 * Upset Potential Card Component
 * 
 * Displays analysis.upsetPotential with prominent probability display
 * and comment. Shows "High upset risk" badge when probability > 30%.
 */

'use client';

import { UpsetPotential } from '@/types';

interface UpsetPotentialCardProps {
  upsetPotential: UpsetPotential;
}

export default function UpsetPotentialCard({ upsetPotential }: UpsetPotentialCardProps) {
  const { upsetProbability, upsetComment } = upsetPotential;
  const isHighRisk = upsetProbability > 30;

  // Determine color based on probability
  const getColorClasses = () => {
    if (upsetProbability >= 50) {
      return {
        bg: 'bg-accent-red/5',
        border: 'border-accent-red/20',
        text: 'text-accent-red',
        progressBg: 'bg-accent-red/10',
        progressFill: 'bg-accent-red',
      };
    }
    if (upsetProbability >= 30) {
      return {
        bg: 'bg-accent-gold/5',
        border: 'border-accent-gold/20',
        text: 'text-accent-gold',
        progressBg: 'bg-accent-gold/10',
        progressFill: 'bg-accent-gold',
      };
    }
    return {
      bg: 'bg-accent-cyan/5',
      border: 'border-accent-cyan/20',
      text: 'text-accent-cyan',
      progressBg: 'bg-accent-cyan/10',
      progressFill: 'bg-accent-cyan',
    };
  };

  const colors = getColorClasses();

  return (
    <div className={`rounded-xl border-2 p-6 ${colors.border} ${colors.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-xl">⚡</span>
          Upset Potential
        </h3>
        
        {isHighRisk && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-accent-red/10 text-accent-red border border-accent-red/30">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            High Upset Risk
          </span>
        )}
      </div>

      {/* Probability Display */}
      <div className="flex items-center gap-6 mb-4">
        <div className={`w-24 h-24 rounded-full border-4 ${colors.border} flex items-center justify-center bg-white`}>
          <span className={`text-3xl font-bold ${colors.text}`}>
            {upsetProbability}%
          </span>
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">Probability of upset</p>
          <div className={`w-full h-3 rounded-full ${colors.progressBg} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${colors.progressFill} transition-all duration-500`}
              style={{ width: `${Math.min(upsetProbability, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-gray-700 text-sm leading-relaxed">
          {upsetComment}
        </p>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-white/70 rounded-lg">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> An upset occurs when the underdog wins against the expected favorite.
          {upsetProbability > 30 && (
            <span className="text-orange-600 font-medium">
              {' '}This match shows elevated upset potential.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
