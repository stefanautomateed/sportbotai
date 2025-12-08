/**
 * Tactical Analysis Section Component
 * 
 * Displays analysis.tacticalAnalysis with styles summary,
 * match narrative, key match factors, and expert conclusion.
 */

'use client';

import { TacticalAnalysis } from '@/types';

interface TacticalAnalysisSectionProps {
  tacticalAnalysis: TacticalAnalysis;
}

export default function TacticalAnalysisSection({ tacticalAnalysis }: TacticalAnalysisSectionProps) {
  const { stylesSummary, matchNarrative, keyMatchFactors, expertConclusionOneLiner } = tacticalAnalysis;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-xl">📝</span>
        Tactical Analysis
      </h3>

      {/* Styles Summary */}
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>🎮</span>
          Playing Styles
        </h4>
        <p className="text-gray-600 text-sm leading-relaxed">
          {stylesSummary}
        </p>
      </div>

      {/* Match Narrative */}
      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>🎬</span>
          Match Narrative
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">
          {matchNarrative}
        </p>
      </div>

      {/* Key Match Factors */}
      {keyMatchFactors && keyMatchFactors.length > 0 && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⭐</span>
            Key Match Factors
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {keyMatchFactors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-accent-lime/10 text-accent-lime rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expert Conclusion */}
      <div className="border-t border-gray-100 pt-4">
        <div className="p-4 bg-primary-900 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-xs text-accent-lime font-semibold mb-1">Expert Conclusion</p>
              <p className="text-white font-medium italic text-lg leading-relaxed">
                &ldquo;{expertConclusionOneLiner}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
