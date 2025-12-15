/**
 * Signal Analysis Component - Premium Match Intelligence
 * 
 * Clean, minimal display of normalized signals.
 * No raw stats. No clutter. Just sharp insights.
 * 
 * Designed to look the same across ALL sports.
 */

'use client';

interface SignalAnalysisProps {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  favored: 'home' | 'away' | 'draw';
  confidence: 'high' | 'medium' | 'low';
  snapshot: string[];
  gameFlow: string;
  riskFactors: string[];
  signals?: {
    formLabel: string;
    strengthEdgeLabel: string;
    tempoLabel: string;
    efficiencyLabel: string;
    availabilityLabel: string;
  };
}

export default function SignalAnalysis({
  homeTeam,
  awayTeam,
  favored,
  confidence,
  snapshot,
  gameFlow,
  riskFactors,
  signals,
}: SignalAnalysisProps) {
  const favoredTeam = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'Draw';
  
  const confidenceConfig = {
    high: { label: 'High Confidence', color: 'text-emerald-400', ring: 'ring-emerald-500/30' },
    medium: { label: 'Medium Confidence', color: 'text-amber-400', ring: 'ring-amber-500/30' },
    low: { label: 'Low Confidence', color: 'text-zinc-400', ring: 'ring-zinc-500/30' },
  }[confidence];

  return (
    <div className="space-y-6">
      {/* Verdict Card - Clean and decisive */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
        
        <div className="relative p-6">
          {/* Verdict Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-white/[0.04] ring-1 ${confidenceConfig.ring} flex items-center justify-center`}>
                <span className="text-2xl">
                  {favored === 'draw' ? '⚖️' : favored === 'home' ? '🏠' : '✈️'}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5">
                  Analysis Points To
                </p>
                <h2 className="text-xl font-semibold text-white">
                  {favored === 'draw' ? 'Draw' : `${favoredTeam}`}
                </h2>
              </div>
            </div>
            <span className={`text-xs font-medium ${confidenceConfig.color}`}>
              {confidenceConfig.label}
            </span>
          </div>

          {/* Normalized Signals Grid - The Universal Framework */}
          {signals && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <SignalPill label="Form" value={signals.formLabel} />
              <SignalPill label="Edge" value={signals.strengthEdgeLabel} />
              <SignalPill label="Tempo" value={signals.tempoLabel} />
              <SignalPill label="Efficiency" value={signals.efficiencyLabel} />
              <SignalPill label="Availability" value={signals.availabilityLabel} />
            </div>
          )}
        </div>
      </div>

      {/* Match Snapshot - The Key Insights */}
      {snapshot && snapshot.length > 0 && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
          <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
            Match Snapshot
          </h3>
          <ul className="space-y-3">
            {snapshot.slice(0, 5).map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                <span className="text-[15px] text-zinc-300 leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Game Flow - How it unfolds */}
      {gameFlow && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
          <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4">
            Game Flow Expectation
          </h3>
          <p className="text-[15px] text-zinc-300 leading-relaxed">
            {gameFlow}
          </p>
        </div>
      )}

      {/* Risk Factors - What could change */}
      {riskFactors && riskFactors.length > 0 && (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
          <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="text-amber-500">⚠</span>
            Risk Factors
          </h3>
          <ul className="space-y-2">
            {riskFactors.map((risk, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-2 flex-shrink-0" />
                <span className="text-[15px] text-zinc-400 leading-relaxed">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer - Always present */}
      <p className="text-[11px] text-zinc-600 text-center px-4">
        This analysis is for informational purposes only. Not betting advice.
      </p>
    </div>
  );
}

/**
 * Signal Pill Component - Compact signal display
 */
function SignalPill({ label, value }: { label: string; value: string }) {
  // Extract the key part of the value for display
  const displayValue = value
    .replace(/expected/i, '')
    .replace(/impact:?/i, '')
    .trim();

  return (
    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
      <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-xs font-medium text-zinc-300 truncate" title={displayValue}>
        {displayValue}
      </p>
    </div>
  );
}
