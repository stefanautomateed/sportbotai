/**
 * Viral Stats Bar Component
 * 
 * Horizontal bar of shareable, screenshot-worthy stats.
 * H2H record, Form streak, Key absence - the stuff people share.
 */

'use client';

interface ViralStatsBarProps {
  homeTeam: string;
  awayTeam: string;
  stats: {
    h2h: {
      /** e.g., "7 matches unbeaten" or "3 wins in a row" */
      headline: string;
      /** Who has the upper hand */
      favors: 'home' | 'away' | 'even';
    };
    form: {
      home: string; // "WWWDL"
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

const FormBadge = ({ result }: { result: string }) => {
  const colors: Record<string, string> = {
    'W': 'bg-green-500',
    'D': 'bg-yellow-500', 
    'L': 'bg-red-500',
  };
  return (
    <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${colors[result] || 'bg-gray-500'}`}>
      {result}
    </span>
  );
};

export default function ViralStatsBar({
  homeTeam,
  awayTeam,
  stats,
}: ViralStatsBarProps) {
  // Check if form data is placeholder (all draws = no real data)
  const isPlaceholderForm = (form: string) => form === 'DDDDD' || form.split('').every(r => r === 'D');
  const hasRealFormData = !isPlaceholderForm(stats.form.home) || !isPlaceholderForm(stats.form.away);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* H2H Record */}
      <div className="bg-[#0F1114] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚔️</span>
          <span className="text-xs text-text-muted uppercase tracking-wider">Head to Head</span>
        </div>
        <p className="text-sm font-bold text-white mb-1">{stats.h2h.headline}</p>
        <p className="text-xs text-text-muted">
          {stats.h2h.favors === 'home' ? `${homeTeam} dominates` : 
           stats.h2h.favors === 'away' ? `${awayTeam} dominates` : 
           'Evenly matched'}
        </p>
      </div>

      {/* Form Streaks */}
      <div className="bg-[#0F1114] rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📈</span>
          <span className="text-xs text-text-muted uppercase tracking-wider">Recent Form</span>
        </div>
        
        <div className="space-y-2">
          {/* Home form */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted truncate mr-2">{homeTeam}</span>
            <div className="flex gap-1">
              {stats.form.home.split('').map((r, i) => (
                <FormBadge key={i} result={r} />
              ))}
            </div>
          </div>
          {/* Away form */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted truncate mr-2">{awayTeam}</span>
            <div className="flex gap-1">
              {stats.form.away.split('').map((r, i) => (
                <FormBadge key={i} result={r} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Absence or Streak */}
      {stats.keyAbsence ? (
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl border border-red-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🚨</span>
            <span className="text-xs text-red-400 uppercase tracking-wider font-semibold">Key Absence</span>
          </div>
          <p className="text-sm font-bold text-white mb-1">
            {stats.keyAbsence.player} OUT
          </p>
          <p className="text-xs text-text-muted">
            {stats.keyAbsence.team === 'home' ? homeTeam : awayTeam} without their {stats.keyAbsence.impact === 'star' ? 'star player' : stats.keyAbsence.impact === 'key' ? 'key player' : 'squad player'}
          </p>
        </div>
      ) : stats.streak ? (
        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔥</span>
            <span className="text-xs text-accent uppercase tracking-wider font-semibold">Hot Streak</span>
          </div>
          <p className="text-sm font-bold text-white mb-1">
            {stats.streak.text}
          </p>
          <p className="text-xs text-text-muted">
            {stats.streak.team === 'home' ? homeTeam : awayTeam} on fire
          </p>
        </div>
      ) : (
        <div className="bg-[#0F1114] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✅</span>
            <span className="text-xs text-text-muted uppercase tracking-wider">Squad Status</span>
          </div>
          <p className="text-sm font-bold text-white mb-1">Full Strength</p>
          <p className="text-xs text-text-muted">No major absences reported</p>
        </div>
      )}
    </div>
  );
}
