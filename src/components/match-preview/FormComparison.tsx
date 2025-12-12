/**
 * Form Comparison Component
 * 
 * Visual side-by-side comparison of team form.
 * Shows recent results, trends, and goal stats.
 */

'use client';

interface FormMatch {
  opponent: string;
  result: 'W' | 'D' | 'L';
  score: string;
  date: string;
  home: boolean;
}

interface TeamForm {
  recent: string; // "WWDLW"
  trend: 'up' | 'down' | 'stable';
  goalsScored: number;
  goalsConceded: number;
  lastMatches: FormMatch[];
}

interface FormComparisonProps {
  homeTeam: string;
  awayTeam: string;
  homeForm: TeamForm;
  awayForm: TeamForm;
}

const resultColors = {
  W: 'bg-green-500',
  D: 'bg-yellow-500',
  L: 'bg-red-500',
};

const trendIcons = {
  up: { icon: '📈', color: 'text-green-400', label: 'Rising' },
  down: { icon: '📉', color: 'text-red-400', label: 'Falling' },
  stable: { icon: '➡️', color: 'text-yellow-400', label: 'Stable' },
};

export default function FormComparison({
  homeTeam,
  awayTeam,
  homeForm,
  awayForm,
}: FormComparisonProps) {
  const homeTrend = trendIcons[homeForm.trend];
  const awayTrend = trendIcons[awayForm.trend];

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recent Form</h3>
            <p className="text-xs text-text-muted">Last 5 matches</p>
          </div>
        </div>
      </div>

      {/* Form comparison */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Home Team Form */}
          <TeamFormCard 
            teamName={homeTeam}
            form={homeForm}
            isHome={true}
          />

          {/* Away Team Form */}
          <TeamFormCard 
            teamName={awayTeam}
            form={awayForm}
            isHome={false}
          />
        </div>

        {/* Form String Visual */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4">
            {/* Home form string */}
            <div className="text-center">
              <p className="text-xs text-text-muted mb-2">Form (oldest → newest)</p>
              <div className="flex justify-center gap-1.5">
                {homeForm.recent.split('').map((result, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${resultColors[result as 'W' | 'D' | 'L']}`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>

            {/* Away form string */}
            <div className="text-center">
              <p className="text-xs text-text-muted mb-2">Form (oldest → newest)</p>
              <div className="flex justify-center gap-1.5">
                {awayForm.recent.split('').map((result, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${resultColors[result as 'W' | 'D' | 'L']}`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamFormCard({ 
  teamName, 
  form, 
  isHome 
}: { 
  teamName: string; 
  form: TeamForm; 
  isHome: boolean;
}) {
  const trend = trendIcons[form.trend];
  const goalDiff = form.goalsScored - form.goalsConceded;
  
  return (
    <div className={`bg-white/5 rounded-xl p-4 ${isHome ? '' : ''}`}>
      {/* Team name */}
      <h4 className="font-semibold text-white text-sm mb-3 truncate">{teamName}</h4>
      
      {/* Trend indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{trend.icon}</span>
        <span className={`text-sm font-medium ${trend.color}`}>{trend.label}</span>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Goals For</span>
          <span className="font-semibold text-green-400">{form.goalsScored}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Goals Against</span>
          <span className="font-semibold text-red-400">{form.goalsConceded}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
          <span className="text-text-muted">Goal Diff</span>
          <span className={`font-bold ${goalDiff > 0 ? 'text-green-400' : goalDiff < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
            {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
          </span>
        </div>
      </div>

      {/* Recent matches preview */}
      {form.lastMatches && form.lastMatches.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-text-muted mb-2">Last match</p>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${resultColors[form.lastMatches[0].result]}`}>
              {form.lastMatches[0].result}
            </div>
            <span className="text-sm text-white truncate">
              {form.lastMatches[0].home ? 'vs' : '@'} {form.lastMatches[0].opponent}
            </span>
            <span className="text-sm text-text-secondary ml-auto">
              {form.lastMatches[0].score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
