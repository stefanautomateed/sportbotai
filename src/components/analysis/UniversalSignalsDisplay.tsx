/**
 * Universal Signals Display - Premium UI Component
 * 
 * Displays the 5 normalized signals in a clean, consistent format.
 * Works identically for ALL sports. No raw stats. Just clean labels.
 */

'use client';

import { UniversalSignals } from '@/lib/universal-signals';

interface UniversalSignalsDisplayProps {
  signals: UniversalSignals;
  homeTeam: string;
  awayTeam: string;
}

export default function UniversalSignalsDisplay({
  signals,
  homeTeam,
  awayTeam,
}: UniversalSignalsDisplayProps) {
  const { display, confidence, clarity_score } = signals;
  
  // Determine the favored side
  const favoredSide = display.edge.direction === 'home' ? homeTeam
    : display.edge.direction === 'away' ? awayTeam
    : null;

  return (
    <div className="space-y-5">
      {/* Verdict Bar - The headline */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
        
        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${confidence === 'high' ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' :
                  confidence === 'medium' ? 'bg-amber-500/10 ring-1 ring-amber-500/30' :
                  'bg-zinc-500/10 ring-1 ring-zinc-500/30'}
              `}>
                <span className="text-lg">
                  {confidence === 'high' ? '◉' : confidence === 'medium' ? '◎' : '○'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                  Analysis Points To
                </p>
                <p className="text-base font-semibold text-white">
                  {favoredSide || 'No Clear Edge'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${
                confidence === 'high' ? 'text-emerald-400' :
                confidence === 'medium' ? 'text-amber-400' :
                'text-zinc-500'
              }`}>
                {confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low'} Confidence
              </p>
              <p className="text-[10px] text-zinc-600">
                {clarity_score}% signal clarity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The 5 Signals Grid - Clean, uniform, premium */}
      <div className="grid grid-cols-1 gap-3">
        {/* Form */}
        <SignalRow
          icon="📊"
          label="Form"
          value={display.form.label}
          detail={
            display.form.trend !== 'balanced' 
              ? `${display.form.home === 'strong' ? homeTeam : awayTeam} in better form`
              : 'Both sides similar'
          }
          color={
            display.form.trend === 'home_better' ? 'emerald' :
            display.form.trend === 'away_better' ? 'blue' :
            'zinc'
          }
        />
        
        {/* Strength Edge */}
        <SignalRow
          icon="⚡"
          label="Strength Edge"
          value={display.edge.label}
          detail={
            display.edge.direction !== 'even'
              ? `${display.edge.percentage}% advantage`
              : 'No significant edge'
          }
          color={
            display.edge.percentage >= 5 ? 'emerald' :
            display.edge.percentage >= 3 ? 'amber' :
            'zinc'
          }
        />
        
        {/* Tempo */}
        <SignalRow
          icon="🎯"
          label="Tempo"
          value={display.tempo.label}
          detail={
            display.tempo.level === 'high' ? 'Expect an open game' :
            display.tempo.level === 'low' ? 'Likely cagey affair' :
            'Standard pace expected'
          }
          color={
            display.tempo.level === 'high' ? 'amber' :
            display.tempo.level === 'low' ? 'blue' :
            'zinc'
          }
        />
        
        {/* Efficiency */}
        <SignalRow
          icon="📈"
          label="Efficiency"
          value={display.efficiency.label}
          detail={
            display.efficiency.winner !== 'balanced'
              ? `${display.efficiency.winner === 'home' ? homeTeam : awayTeam} more clinical`
              : 'No clear efficiency edge'
          }
          color={
            display.efficiency.winner === 'home' ? 'emerald' :
            display.efficiency.winner === 'away' ? 'blue' :
            'zinc'
          }
        />
        
        {/* Availability */}
        <SignalRow
          icon="🏥"
          label="Availability"
          value={display.availability.label}
          detail={display.availability.note || 'No major concerns'}
          color={
            display.availability.level === 'critical' ? 'red' :
            display.availability.level === 'high' ? 'amber' :
            display.availability.level === 'medium' ? 'amber' :
            'zinc'
          }
        />
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 text-center">
        Signals are calculated from recent performance data. Not betting advice.
      </p>
    </div>
  );
}

/**
 * Individual Signal Row - Clean, consistent display
 */
function SignalRow({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  color: 'emerald' | 'amber' | 'blue' | 'red' | 'zinc';
}) {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10',
    zinc: 'text-zinc-400 bg-zinc-500/10',
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0b] border border-white/[0.04]">
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
        <span className="text-sm">{icon}</span>
      </div>
      
      {/* Label & Detail */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          {detail}
        </p>
      </div>
      
      {/* Value */}
      <div className="flex-shrink-0">
        <span className={`text-sm font-semibold ${colorClasses[color].split(' ')[0]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact Signals Pills - For header/summary areas
 */
export function SignalPills({ signals }: { signals: UniversalSignals }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill label="Form" value={signals.form} />
      <Pill label="Edge" value={signals.strength_edge} />
      <Pill label="Tempo" value={signals.tempo} />
      <Pill label="Eff." value={signals.efficiency_edge} />
      <Pill label="Avail." value={signals.availability_impact} />
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="mx-1.5 text-zinc-600">·</span>
      <span className="text-[11px] text-zinc-300 font-medium">{value}</span>
    </div>
  );
}
