/**
 * Key Absences Component
 * 
 * Shows injured and suspended players with impact assessment.
 * Visual, impact-focused display.
 */

'use client';

interface Absence {
  player: string;
  reason: 'injury' | 'suspension' | 'doubtful' | 'other';
  details?: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  position?: string;
}

interface TeamAbsences {
  team: string;
  absences: Absence[];
}

interface KeyAbsencesProps {
  homeAbsences: TeamAbsences;
  awayAbsences: TeamAbsences;
}

const impactConfig = {
  critical: {
    color: 'bg-red-500/20 border-red-500/30 text-red-400',
    badge: 'bg-red-500 text-white',
    icon: '🔴',
    label: 'Critical',
  },
  high: {
    color: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    badge: 'bg-orange-500 text-white',
    icon: '🟠',
    label: 'High Impact',
  },
  medium: {
    color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    badge: 'bg-yellow-500 text-black',
    icon: '🟡',
    label: 'Moderate',
  },
  low: {
    color: 'bg-green-500/20 border-green-500/30 text-green-400',
    badge: 'bg-green-500 text-black',
    icon: '🟢',
    label: 'Low Impact',
  },
};

const reasonIcons = {
  injury: '🩹',
  suspension: '🟥',
  doubtful: '❓',
  other: '❌',
};

function PlayerCard({ absence }: { absence: Absence }) {
  const impact = impactConfig[absence.impact];
  
  return (
    <div className={`rounded-xl border p-3 ${impact.color}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{reasonIcons[absence.reason]}</span>
          <div>
            <p className="font-semibold text-white text-sm">{absence.player}</p>
            {absence.position && (
              <p className="text-xs opacity-75">{absence.position}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impact.badge}`}>
          {impact.label}
        </span>
      </div>
      {absence.details && (
        <p className="text-xs opacity-75">{absence.details}</p>
      )}
    </div>
  );
}

function TeamAbsencesList({ data }: { data: TeamAbsences }) {
  // Sort by impact priority
  const sortedAbsences = [...data.absences].sort((a, b) => {
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return priority[a.impact] - priority[b.impact];
  });

  if (sortedAbsences.length === 0) {
    return (
      <div className="text-center py-6 bg-white/5 rounded-xl">
        <span className="text-2xl block mb-2">✅</span>
        <p className="text-sm text-text-muted">Full squad available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedAbsences.map((absence, index) => (
        <PlayerCard key={index} absence={absence} />
      ))}
    </div>
  );
}

export default function KeyAbsences({
  homeAbsences,
  awayAbsences,
}: KeyAbsencesProps) {
  const totalAbsences = homeAbsences.absences.length + awayAbsences.absences.length;
  const criticalCount = [...homeAbsences.absences, ...awayAbsences.absences].filter(
    a => a.impact === 'critical'
  ).length;

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Key Absences</h3>
              <p className="text-xs text-text-muted">
                {totalAbsences === 0 
                  ? 'No confirmed absences' 
                  : `${totalAbsences} player${totalAbsences > 1 ? 's' : ''} unavailable`}
              </p>
            </div>
          </div>
          {criticalCount > 0 && (
            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
              {criticalCount} critical
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4 p-4">
        {/* Home team */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            {homeAbsences.team}
          </h4>
          <TeamAbsencesList data={homeAbsences} />
        </div>

        {/* Away team */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            {awayAbsences.team}
          </h4>
          <TeamAbsencesList data={awayAbsences} />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="flex flex-wrap gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">🩹 Injury</span>
          <span className="flex items-center gap-1">🟥 Suspended</span>
          <span className="flex items-center gap-1">❓ Doubtful</span>
        </div>
      </div>
    </div>
  );
}
