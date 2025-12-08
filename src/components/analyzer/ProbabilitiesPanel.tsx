/**
 * Probabilities Panel Component
 * 
 * Displays analysis.probabilities as visual percentages.
 * Shows homeWin, draw, awayWin, over, under.
 */

'use client';

import { Probabilities } from '@/types';

interface ProbabilitiesPanelProps {
  probabilities: Probabilities;
  homeTeam: string;
  awayTeam: string;
}

interface ProbabilityBarProps {
  label: string;
  value: number | null;
  color: string;
  sublabel?: string;
}

function ProbabilityBar({ label, value, color, sublabel }: ProbabilityBarProps) {
  const displayValue = value !== null ? value : null;
  const barWidth = displayValue !== null ? Math.min(displayValue, 100) : 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {sublabel && <span className="text-xs text-gray-500 ml-1">({sublabel})</span>}
        </div>
        <span className={`text-lg font-bold ${displayValue !== null ? color : 'text-gray-400'}`}>
          {displayValue !== null ? `${displayValue}%` : 'N/A'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        {displayValue !== null && (
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
            style={{ width: `${barWidth}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default function ProbabilitiesPanel({ probabilities, homeTeam, awayTeam }: ProbabilitiesPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Probability Estimates
      </h3>

      {/* Main 1X2 Probabilities */}
      <div className="space-y-4">
        <ProbabilityBar
          label={homeTeam}
          sublabel="Home Win"
          value={probabilities.homeWin}
          color="text-accent-green"
        />
        <ProbabilityBar
          label="Draw"
          sublabel="X"
          value={probabilities.draw}
          color="text-gray-500"
        />
        <ProbabilityBar
          label={awayTeam}
          sublabel="Away Win"
          value={probabilities.awayWin}
          color="text-accent-cyan"
        />
      </div>

      {/* Over/Under Section */}
      {(probabilities.over !== null || probabilities.under !== null) && (
        <>
          <div className="border-t border-gray-100 my-5" />
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Over/Under Goals</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Over 2.5</p>
              <p className={`text-2xl font-bold ${probabilities.over !== null ? 'text-accent-lime' : 'text-gray-400'}`}>
                {probabilities.over !== null ? `${probabilities.over}%` : 'N/A'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Under 2.5</p>
              <p className={`text-2xl font-bold ${probabilities.under !== null ? 'text-accent-cyan' : 'text-gray-400'}`}>
                {probabilities.under !== null ? `${probabilities.under}%` : 'N/A'}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Visual Summary - Three Columns */}
      <div className="border-t border-gray-100 mt-5 pt-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <p className="text-xs text-accent-green font-medium">1</p>
            <p className="text-xl font-bold text-accent-green">
              {probabilities.homeWin !== null ? `${probabilities.homeWin}%` : '-'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gray-100 border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">X</p>
            <p className="text-xl font-bold text-gray-600">
              {probabilities.draw !== null ? `${probabilities.draw}%` : '-'}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
            <p className="text-xs text-accent-cyan font-medium">2</p>
            <p className="text-xl font-bold text-accent-cyan">
              {probabilities.awayWin !== null ? `${probabilities.awayWin}%` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
