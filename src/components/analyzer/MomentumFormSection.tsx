/**
 * Momentum & Form Section Component
 * 
 * Displays analysis.momentumAndForm with home/away momentum scores,
 * trends (with arrow icons), and key form factors.
 */

'use client';

import { MomentumAndForm, Trend } from '@/types';

interface MomentumFormSectionProps {
  momentumAndForm: MomentumAndForm;
  homeTeam: string;
  awayTeam: string;
}

const trendConfig: Record<Trend, { label: string; icon: string; color: string; bgColor: string }> = {
  RISING: { label: 'Rising', icon: '↗', color: 'text-accent-green', bgColor: 'bg-accent-green/10' },
  FALLING: { label: 'Falling', icon: '↘', color: 'text-accent-red', bgColor: 'bg-accent-red/10' },
  STABLE: { label: 'Stable', icon: '→', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  UNKNOWN: { label: 'Unknown', icon: '?', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};

interface MomentumMeterProps {
  score: number | null;
  trend: Trend;
  teamName: string;
  isHome: boolean;
}

function MomentumMeter({ score, trend, teamName, isHome }: MomentumMeterProps) {
  const trendInfo = trendConfig[trend];
  const displayScore = score !== null ? score : 0;
  const percentage = (displayScore / 10) * 100;

  // Color gradient based on score
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-400';
    if (s >= 7) return 'text-accent-green';
    if (s >= 5) return 'text-accent-gold';
    return 'text-accent-red';
  };

  const getBarColor = (s: number | null) => {
    if (s === null) return 'bg-gray-300';
    if (s >= 7) return 'bg-accent-green';
    if (s >= 5) return 'bg-accent-gold';
    return 'bg-accent-red';
  };

  return (
    <div className={`p-4 rounded-lg ${isHome ? 'bg-accent-green/5 border border-accent-green/20' : 'bg-accent-cyan/5 border border-accent-cyan/20'}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">{isHome ? 'Home' : 'Away'}</p>
          <p className="font-semibold text-gray-800">{teamName}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendInfo.color} ${trendInfo.bgColor}`}>
          <span className="text-lg">{trendInfo.icon}</span>
          {trendInfo.label}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex items-end justify-between">
          <span className="text-sm text-gray-500">Momentum Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score !== null ? `${score}/10` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: score !== null ? `${percentage}%` : '0%' }}
        />
      </div>
    </div>
  );
}

export default function MomentumFormSection({ momentumAndForm, homeTeam, awayTeam }: MomentumFormSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-xl">📈</span>
        Momentum & Form
      </h3>

      {/* Two-column momentum display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <MomentumMeter
          score={momentumAndForm.homeMomentumScore}
          trend={momentumAndForm.homeTrend}
          teamName={homeTeam}
          isHome={true}
        />
        <MomentumMeter
          score={momentumAndForm.awayMomentumScore}
          trend={momentumAndForm.awayTrend}
          teamName={awayTeam}
          isHome={false}
        />
      </div>

      {/* Key Form Factors */}
      {momentumAndForm.keyFormFactors && momentumAndForm.keyFormFactors.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span>
            Key Form Factors
          </h4>
          <ul className="space-y-2">
            {momentumAndForm.keyFormFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 bg-accent-cyan/10 text-accent-cyan rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
