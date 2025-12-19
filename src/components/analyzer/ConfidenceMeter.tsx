/**
 * Confidence Meter Component
 * 
 * A visual gauge showing AI confidence level with explanation.
 * Combines multiple confidence signals:
 * - Data quality (API vs manual)
 * - Probability spread
 * - Market stability
 * - Form data availability
 * 
 * Displays as an animated arc meter with percentage and explanation.
 */

'use client';

import { AnalyzeResponse, DataQuality } from '@/types';

interface ConfidenceMeterProps {
  result: AnalyzeResponse;
}

// Calculate overall confidence score (0-100)
function calculateConfidenceScore(result: AnalyzeResponse): {
  score: number;
  factors: { name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
} {
  const factors: { name: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[] = [];
  let score = 50; // Start at baseline

  // Factor 1: Data Quality (+/- 15 points)
  const dataQuality = result.matchInfo.dataQuality;
  if (dataQuality === 'HIGH') {
    score += 15;
    factors.push({ name: 'Data Quality', impact: 'positive', detail: 'High-quality data available' });
  } else if (dataQuality === 'LOW') {
    score -= 15;
    factors.push({ name: 'Data Quality', impact: 'negative', detail: 'Limited data available' });
  } else {
    factors.push({ name: 'Data Quality', impact: 'neutral', detail: 'Standard data quality' });
  }

  // Factor 2: Form Data Source (+/- 10 points) - with null safety
  const formSource = result.momentumAndForm?.formDataSource;
  if (formSource === 'API_FOOTBALL' || formSource === 'API_SPORTS') {
    score += 10;
    factors.push({ name: 'Form Data', impact: 'positive', detail: 'Real-time form data' });
  } else if (formSource === 'UNAVAILABLE') {
    score -= 10;
    factors.push({ name: 'Form Data', impact: 'negative', detail: 'Form data unavailable' });
  }

  // Factor 3: Probability Spread (+/- 10 points)
  const probs = result.probabilities;
  const homeProb = probs?.homeWin ?? 0;
  const awayProb = probs?.awayWin ?? 0;
  const drawProb = probs?.draw ?? 0;
  const maxProb = Math.max(homeProb, awayProb, drawProb);
  
  if (maxProb >= 60) {
    score += 10;
    factors.push({ name: 'Clear Favorite', impact: 'positive', detail: `${maxProb}% probability detected` });
  } else if (maxProb <= 40) {
    score -= 5;
    factors.push({ name: 'Tight Match', impact: 'negative', detail: 'No clear favorite' });
  }

  // Factor 4: H2H Data (+5 points if available) - with null safety
  const h2h = result.momentumAndForm?.h2hSummary;
  if (h2h && h2h.totalMatches >= 3) {
    score += 5;
    factors.push({ name: 'H2H History', impact: 'positive', detail: `${h2h.totalMatches} previous meetings` });
  }

  // Factor 5: Market Stability (+/- 10 points) - with null safety
  const markets = result.marketStability?.markets;
  if (markets) {
    const stabilities = [markets.main_1x2?.stability, markets.over_under?.stability, markets.btts?.stability].filter(Boolean);
    const highStabilityCount = stabilities.filter(s => s === 'HIGH').length;
    const lowStabilityCount = stabilities.filter(s => s === 'LOW').length;
    
    if (highStabilityCount >= 2) {
      score += 10;
      factors.push({ name: 'Market Stability', impact: 'positive', detail: 'Stable betting markets' });
    } else if (lowStabilityCount >= 2) {
      score -= 10;
      factors.push({ name: 'Market Volatility', impact: 'negative', detail: 'Volatile betting markets' });
    }
  }

  // Factor 6: Risk Level (+/- 5 points) - with null safety
  const riskLevel = result.riskAnalysis?.overallRiskLevel;
  if (riskLevel === 'LOW') {
    score += 5;
  } else if (riskLevel === 'HIGH') {
    score -= 5;
  }

  // Clamp score between 20 and 95
  score = Math.max(20, Math.min(95, score));

  return { score, factors };
}

// Get confidence level label and color
function getConfidenceLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: 'Strong Data',
      color: 'text-success',
      bgColor: 'bg-success',
      description: 'Rich data available for this matchup',
    };
  }
  if (score >= 65) {
    return {
      label: 'Good Coverage',
      color: 'text-accent',
      bgColor: 'bg-accent',
      description: 'Solid data foundation for analysis',
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate',
      color: 'text-warning',
      bgColor: 'bg-warning',
      description: 'Some data gaps in the analysis',
    };
  }
  if (score >= 35) {
    return {
      label: 'Limited',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400',
      description: 'Sparse data available, interpret carefully',
    };
  }
  return {
    label: 'Incomplete',
    color: 'text-danger',
    bgColor: 'bg-danger',
    description: 'Significant data gaps, limited analysis',
  };
}

export default function ConfidenceMeter({ result }: ConfidenceMeterProps) {
  const { score, factors } = calculateConfidenceScore(result);
  
  // Only show the component when we have good data (score >= 65)
  // Don't highlight negatives - just hide the whole thing
  if (score < 65) {
    return null;
  }
  
  const level = getConfidenceLevel(score);
  
  // Positive factors only (we don't show negatives anymore)
  const positiveFactors = factors.filter(f => f.impact === 'positive');

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">Data Quality</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">Analysis data coverage</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Simple Badge Display */}
        <div className="flex flex-col items-center mb-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {level.label}
          </span>
          <p className="text-xs text-text-muted mt-3 text-center">{level.description}</p>
        </div>

        {/* Positive Factors Only */}
        {positiveFactors.length > 0 && (
          <div className="border-t border-divider pt-4 mt-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {positiveFactors.slice(0, 4).map((factor, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[10px] sm:text-xs text-emerald-400"
                >
                  <span className="text-emerald-400">✓</span>
                  {factor.detail}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
