/**
 * Context Factors Component
 * 
 * The "hidden" factors that matter:
 * - Rest days
 * - Motivation
 * - Manager record
 * - Historical fixture average
 */

'use client';

interface ContextFactor {
  id: string;
  icon: string;
  label: string;
  value: string;
  /** Optional: who this helps */
  favors?: 'home' | 'away' | 'neutral';
  /** Optional: extra context */
  note?: string;
}

interface ContextFactorsProps {
  factors: ContextFactor[];
  homeTeam: string;
  awayTeam: string;
}

export default function ContextFactors({
  factors,
  homeTeam,
  awayTeam,
}: ContextFactorsProps) {
  if (factors.length === 0) return null;

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Context & Factors</h3>
            <p className="text-xs text-text-muted">Additional intel that could matter</p>
          </div>
        </div>
      </div>

      {/* Factors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/5">
        {factors.map((factor) => (
          <div 
            key={factor.id}
            className="bg-[#0F1114] p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{factor.icon}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                {factor.label}
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white mb-1">{factor.value}</p>
            
            {factor.favors && factor.favors !== 'neutral' && (
              <span className={`text-[10px] ${
                factor.favors === 'home' ? 'text-green-400' : 'text-blue-400'
              }`}>
                → {factor.favors === 'home' ? homeTeam : awayTeam}
              </span>
            )}
            
            {factor.note && (
              <p className="text-[10px] text-text-muted mt-1">{factor.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
