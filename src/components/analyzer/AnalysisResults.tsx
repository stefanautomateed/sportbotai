/**
 * Analysis Results Component
 * 
 * Main container that renders all analysis sections
 * with modern sports analytics dashboard design.
 */

'use client';

import { AnalyzeResponse } from '@/types';
import MatchSummaryCard from './MatchSummaryCard';
import ProbabilitiesPanel from './ProbabilitiesPanel';
import ValueAnalysisCard from './ValueAnalysisCard';
import RiskAnalysisCard from './RiskAnalysisCard';
import MomentumFormSection from './MomentumFormSection';
import MarketStabilitySection from './MarketStabilitySection';
import UpsetPotentialCard from './UpsetPotentialCard';
import TacticalAnalysisSection from './TacticalAnalysisSection';
import UserContextBox from './UserContextBox';
import WarningsSection from './WarningsSection';
import ListenToAnalysisButton from './ListenToAnalysisButton';

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  // Error state
  if (!result.success && result.error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Analysis Error</h3>
            <p className="text-gray-600">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Match Summary */}
      <MatchSummaryCard 
        matchInfo={result.matchInfo} 
        meta={result.meta} 
      />

      {/* Listen to Analysis - Integrated into a subtle card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-cyan/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Audio Analysis</h3>
              <p className="text-sm text-gray-500">Listen to the AI-generated narration</p>
            </div>
          </div>
          <ListenToAnalysisButton result={result} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ProbabilitiesPanel 
            probabilities={result.probabilities}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
          />
          <ValueAnalysisCard valueAnalysis={result.valueAnalysis} />
          <MomentumFormSection 
            momentumAndForm={result.momentumAndForm}
            homeTeam={result.matchInfo.homeTeam}
            awayTeam={result.matchInfo.awayTeam}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <RiskAnalysisCard riskAnalysis={result.riskAnalysis} />
          <UpsetPotentialCard upsetPotential={result.upsetPotential} />
          <MarketStabilitySection marketStability={result.marketStability} />
        </div>
      </div>

      {/* Full Width Sections */}
      <TacticalAnalysisSection tacticalAnalysis={result.tacticalAnalysis} />
      <UserContextBox userContext={result.userContext} />
      <WarningsSection warnings={result.meta.warnings} />

      {/* Footer Meta - Subtle */}
      <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>
          Analysis by BetSense AI v{result.meta.modelVersion} • 
          {new Date(result.meta.analysisGeneratedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
