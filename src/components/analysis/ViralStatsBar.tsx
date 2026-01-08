/**
 * Viral Stats Bar Component
 * 
 * Horizontal bar of shareable, screenshot-worthy stats.
 * H2H record and Key absence/Streak - the stuff people share.
 * 
 * Note: Form is shown in UniversalSignalsDisplay, not here.
 */

'use client';

interface ViralStatsBarProps {
  homeTeam: string;
  awayTeam: string;
  hasDraw?: boolean; // Whether this sport has draws
  stats: {
    h2h: {
      /** e.g., "7 matches unbeaten" or "3 wins in a row" */
      headline: string;
      /** Who has the upper hand */
      favors: 'home' | 'away' | 'even';
    };
    form?: {
      home: string; // "WWWDL" - kept for API compat but not displayed
      away: string; // "LDWWW"
    };
    keyAbsence?: {
      team: 'home' | 'away';
      player: string;
      impact: 'star' | 'key' | 'rotation';
    };
    streak?: {
      text: string; // "5 wins in a row"
      team: 'home' | 'away';
    };
  };
}

export default function ViralStatsBar({
  homeTeam,
  awayTeam,
  hasDraw = true,
  stats,
}: ViralStatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* H2H Record */}
      <div className="bg-[#0F1114] rounded-xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🆚</span>
          <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Head to Head</span>
        </div>
        <p className="text-base font-bold text-white mb-2">{stats.h2h.headline}</p>
        <p className="text-sm text-text-muted">
          {stats.h2h.favors === 'home' ? `${homeTeam} dominates` : 
           stats.h2h.favors === 'away' ? `${awayTeam} dominates` : 
           'Evenly matched'}
        </p>
      </div>

      {/* Key Absence or Streak */}
      {stats.keyAbsence ? (
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🚨</span>
            <span className="text-xs text-red-400 uppercase tracking-wider font-bold">Key Absence</span>
          </div>
          <p className="text-base font-bold text-white mb-2">
            {stats.keyAbsence.player} OUT
          </p>
          <p className="text-sm text-text-muted">
            {stats.keyAbsence.team === 'home' ? homeTeam : awayTeam} without their {stats.keyAbsence.impact === 'star' ? 'star player' : stats.keyAbsence.impact === 'key' ? 'key player' : 'squad player'}
          </p>
        </div>
      ) : stats.streak ? (
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔥</span>
            <span className="text-xs text-accent uppercase tracking-wider font-bold">Hot Streak</span>
          </div>
          <p className="text-base font-bold text-white mb-2">
            {stats.streak.text}
          </p>
          <p className="text-sm text-text-muted">
            {stats.streak.team === 'home' ? homeTeam : awayTeam} on fire
          </p>
        </div>
      ) : (
        <div className="bg-[#0F1114] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✅</span>
            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Squad Status</span>
          </div>
          <p className="text-base font-bold text-white mb-2">Full Strength</p>
          <p className="text-sm text-text-muted">No major absences reported</p>
        </div>
      )}
    </div>
  );
}
