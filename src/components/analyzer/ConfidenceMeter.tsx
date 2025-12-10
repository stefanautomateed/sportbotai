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

  // Factor 2: Form Data Source (+/- 10 points)
  const formSource = result.momentumAndForm.formDataSource;
  if (formSource === 'API_FOOTBALL' || formSource === 'API_SPORTS') {
    score += 10;
    factors.push({ name: 'Form Data', impact: 'positive', detail: 'Real-time form data' });
  } else if (formSource === 'UNAVAILABLE') {
    score -= 10;
    factors.push({ name: 'Form Data', impact: 'negative', detail: 'Form data unavailable' });
  }

  // Factor 3: Probability Spread (+/- 10 points)
  const probs = result.probabilities;
  const homeProb = probs.homeWin ?? 0;
  const awayProb = probs.awayWin ?? 0;
  const drawProb = probs.draw ?? 0;
  const maxProb = Math.max(homeProb, awayProb, drawProb);
  
  if (maxProb >= 60) {
    score += 10;
    factors.push({ name: 'Clear Favorite', impact: 'positive', detail: `${maxProb}% probability detected` });
  } else if (maxProb <= 40) {
    score -= 5;
    factors.push({ name: 'Tight Match', impact: 'negative', detail: 'No clear favorite' });
  }

  // Factor 4: H2H Data (+5 points if available)
  const h2h = result.momentumAndForm.h2hSummary;
  if (h2h && h2h.totalMatches >= 3) {
    score += 5;
    factors.push({ name: 'H2H History', impact: 'positive', detail: `${h2h.totalMatches} previous meetings` });
  }

  // Factor 5: Market Stability (+/- 10 points)
  const markets = result.marketStability.markets;
  const stabilities = [markets.main_1x2.stability, markets.over_under.stability, markets.btts.stability];
  const highStabilityCount = stabilities.filter(s => s === 'HIGH').length;
  const lowStabilityCount = stabilities.filter(s => s === 'LOW').length;
  
  if (highStabilityCount >= 2) {
    score += 10;
    factors.push({ name: 'Market Stability', impact: 'positive', detail: 'Stable betting markets' });
  } else if (lowStabilityCount >= 2) {
    score -= 10;
    factors.push({ name: 'Market Volatility', impact: 'negative', detail: 'Volatile betting markets' });
  }

  // Factor 6: Risk Level (+/- 5 points)
  const riskLevel = result.riskAnalysis.overallRiskLevel;
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
      label: 'Very High',
      color: 'text-success',
      bgColor: 'bg-success',
      description: 'Strong confidence in this analysis',
    };
  }
  if (score >= 65) {
    return {
      label: 'High',
      color: 'text-accent',
      bgColor: 'bg-accent',
      description: 'Good confidence, solid data foundation',
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate',
      color: 'text-warning',
      bgColor: 'bg-warning',
      description: 'Reasonable confidence, some uncertainty',
    };
  }
  if (score >= 35) {
    return {
      label: 'Low',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400',
      description: 'Limited confidence, proceed with caution',
    };
  }
  return {
    label: 'Very Low',
    color: 'text-danger',
    bgColor: 'bg-danger',
    description: 'Low confidence, high uncertainty',
  };
}

export default function ConfidenceMeter({ result }: ConfidenceMeterProps) {
  const { score, factors } = calculateConfidenceScore(result);
  const level = getConfidenceLevel(score);
  
  // Calculate arc for the meter (180 degrees = full)
  const arcPercentage = (score / 100) * 180;
  
  // Positive and negative factors
  const positiveFactors = factors.filter(f => f.impact === 'positive');
  const negativeFactors = factors.filter(f => f.impact === 'negative');

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🎯</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">AI Confidence</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">Analysis reliability score</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Confidence Meter Visual */}
        <div className="flex flex-col items-center mb-4">
          {/* Arc Meter */}
          <div className="relative w-40 h-20 sm:w-48 sm:h-24">
            {/* Background Arc */}
            <svg className="w-full h-full" viewBox="0 0 120 60">
              {/* Background track */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-bg-tertiary"
                strokeLinecap="round"
              />
              {/* Filled arc */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className={level.color}
                strokeLinecap="round"
                strokeDasharray={`${(arcPercentage / 180) * 157} 157`}
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                }}
              />
            </svg>
            
            {/* Score Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
              <span className={`text-2xl sm:text-3xl font-bold ${level.color}`}>{score}%</span>
            </div>
          </div>

          {/* Confidence Level Label */}
          <div className="text-center mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${level.bgColor}/20 ${level.color}`}>
              {level.label} Confidence
            </span>
            <p className="text-[10px] sm:text-xs text-text-muted mt-2">{level.description}</p>
          </div>
        </div>

        {/* Factors Grid */}
        <div className="border-t border-divider pt-4 mt-4">
          <p className="text-[10px] sm:text-xs font-medium text-text-muted mb-3">Confidence Factors</p>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Positive Factors */}
            {positiveFactors.slice(0, 2).map((factor, i) => (
              <div key={i} className="flex items-center gap-2 bg-success/5 border border-success/20 rounded-lg p-2">
                <span className="text-success text-xs">✓</span>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-text-primary truncate">{factor.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-text-muted truncate">{factor.detail}</p>
                </div>
              </div>
            ))}
            
            {/* Negative Factors */}
            {negativeFactors.slice(0, 2).map((factor, i) => (
              <div key={i} className="flex items-center gap-2 bg-danger/5 border border-danger/20 rounded-lg p-2">
                <span className="text-danger text-xs">!</span>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-text-primary truncate">{factor.name}</p>
                  <p className="text-[9px] sm:text-[10px] text-text-muted truncate">{factor.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
