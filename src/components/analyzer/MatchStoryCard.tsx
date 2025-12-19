/**
 * Match Story Card Component
 * 
 * AI-generated narrative description of what to expect from the match.
 * Makes the analysis feel alive and engaging.
 * 
 * Features:
 * - Dynamic narrative based on tactical analysis
 * - Key storyline highlights
 * - Premium gradient styling
 */

'use client';

import { AnalyzeResponse } from '@/types';

interface MatchStoryCardProps {
  result: AnalyzeResponse;
}

export default function MatchStoryCard({ result }: MatchStoryCardProps) {
  const { tacticalAnalysis, matchInfo, upsetPotential, momentumAndForm } = result;
  
  // Build a compelling match story from available data
  const buildMatchStory = (): string => {
    // Use the match narrative if available
    if (tacticalAnalysis.matchNarrative && tacticalAnalysis.matchNarrative.length > 20) {
      return tacticalAnalysis.matchNarrative;
    }
    
    // Fallback: build from styles summary and factors
    const parts: string[] = [];
    
    if (tacticalAnalysis.stylesSummary) {
      parts.push(tacticalAnalysis.stylesSummary);
    }
    
    // Add upset potential context if significant
    if (upsetPotential.upsetProbability > 30) {
      parts.push(`Watch for potential upset scenarios.`);
    }
    
    // Add momentum context
    if (momentumAndForm.homeTrend === 'RISING' && momentumAndForm.awayTrend === 'FALLING') {
      parts.push(`${matchInfo.homeTeam} enters with momentum advantage.`);
    } else if (momentumAndForm.awayTrend === 'RISING' && momentumAndForm.homeTrend === 'FALLING') {
      parts.push(`${matchInfo.awayTeam} arrives in better form.`);
    }
    
    return parts.join(' ') || 'An intriguing matchup with multiple tactical dimensions to consider.';
  };

  // Extract key storylines from tactical factors
  const getStorylines = (): string[] => {
    const storylines: string[] = [];
    
    if (tacticalAnalysis.keyMatchFactors && tacticalAnalysis.keyMatchFactors.length > 0) {
      // Take top 3 factors and convert to storylines
      tacticalAnalysis.keyMatchFactors.slice(0, 3).forEach(factor => {
        storylines.push(factor);
      });
    }
    
    return storylines;
  };

  const story = buildMatchStory();
  const storylines = getStorylines();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1318] via-[#0C0F12] to-[#080A0D] border border-accent/10 shadow-lg">
      {/* Subtle glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-8 bg-accent/5 blur-2xl"></div>
      
      {/* Content */}
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <span className="text-xl">🔮</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Match Story</h3>
            <p className="text-xs text-accent/70">AI-Generated Preview</p>
          </div>
        </div>
        
        {/* Main Narrative */}
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-4">
          &ldquo;{story}&rdquo;
        </p>
        
        {/* Key Storylines */}
        {storylines.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Key Factors</p>
            <div className="flex flex-wrap gap-2">
              {storylines.map((line, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full text-xs text-text-secondary"
                >
                  <span className="w-1 h-1 rounded-full bg-accent"></span>
                  {line}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
