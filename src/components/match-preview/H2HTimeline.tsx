/**
 * H2H Timeline Component
 * 
 * Visual timeline of head-to-head history.
 * Shows past meetings with scores and venue info.
 */

'use client';

import { format, parseISO } from 'date-fns';

interface H2HMeeting {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  venue: string;
}

interface H2HData {
  totalMeetings: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  recentMeetings: H2HMeeting[];
}

interface H2HTimelineProps {
  homeTeam: string;
  awayTeam: string;
  h2h: H2HData;
}

export default function H2HTimeline({
  homeTeam,
  awayTeam,
  h2h,
}: H2HTimelineProps) {
  if (!h2h || h2h.totalMeetings === 0) {
    return (
      <div className="bg-[#0F1114] rounded-2xl border border-white/10 p-6 text-center">
        <span className="text-3xl mb-3 block">🤝</span>
        <h3 className="text-base font-bold text-white mb-1">First Meeting</h3>
        <p className="text-sm text-text-secondary">
          No previous meetings between these teams
        </p>
      </div>
    );
  }

  // Calculate percentages for the bar
  const total = h2h.homeWins + h2h.awayWins + h2h.draws;
  const homePercent = total > 0 ? (h2h.homeWins / total) * 100 : 0;
  const drawPercent = total > 0 ? (h2h.draws / total) * 100 : 0;
  const awayPercent = total > 0 ? (h2h.awayWins / total) * 100 : 0;

  return (
    <div className="bg-[#0F1114] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">⚔️</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Head to Head</h3>
            <p className="text-xs text-text-muted">{h2h.totalMeetings} previous meetings</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary bar */}
        <div className="bg-white/5 rounded-xl p-4">
          {/* Team names */}
          <div className="flex justify-between text-sm mb-3">
            <span className="font-medium text-white">{homeTeam}</span>
            <span className="text-text-muted">Draws</span>
            <span className="font-medium text-white">{awayTeam}</span>
          </div>

          {/* Visual bar */}
          <div className="h-4 rounded-full overflow-hidden flex bg-white/10">
            {homePercent > 0 && (
              <div 
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${homePercent}%` }}
              />
            )}
            {drawPercent > 0 && (
              <div 
                className="bg-yellow-500 h-full transition-all duration-500"
                style={{ width: `${drawPercent}%` }}
              />
            )}
            {awayPercent > 0 && (
              <div 
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${awayPercent}%` }}
              />
            )}
          </div>

          {/* Numbers */}
          <div className="flex justify-between text-sm mt-3">
            <span className="text-green-400 font-bold">{h2h.homeWins} wins</span>
            <span className="text-yellow-400 font-bold">{h2h.draws}</span>
            <span className="text-red-400 font-bold">{h2h.awayWins} wins</span>
          </div>
        </div>

        {/* Recent meetings timeline */}
        {h2h.recentMeetings && h2h.recentMeetings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-secondary">Recent Meetings</h4>
            
            {h2h.recentMeetings.slice(0, 5).map((meeting, index) => {
              const [homeScore, awayScore] = meeting.score.split('-').map(s => parseInt(s.trim()));
              const isHomeWin = homeScore > awayScore;
              const isAwayWin = awayScore > homeScore;
              const isDraw = homeScore === awayScore;
              
              // Determine if current home team won this meeting
              const currentHomeWon = meeting.homeTeam === homeTeam ? isHomeWin : isAwayWin;
              const currentAwayWon = meeting.homeTeam === awayTeam ? isHomeWin : isAwayWin;
              
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
                >
                  {/* Date */}
                  <div className="text-xs text-text-muted w-16 flex-shrink-0">
                    {format(parseISO(meeting.date), 'MMM d, yy')}
                  </div>

                  {/* Teams and score */}
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <span className={`text-sm ${meeting.homeTeam === homeTeam ? 'font-semibold text-white' : 'text-text-secondary'}`}>
                      {meeting.homeTeam === homeTeam ? homeTeam : awayTeam}
                    </span>
                    
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                      <span className={`text-sm font-bold ${currentHomeWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-text-secondary'}`}>
                        {meeting.homeTeam === homeTeam ? homeScore : awayScore}
                      </span>
                      <span className="text-text-muted">-</span>
                      <span className={`text-sm font-bold ${currentAwayWon ? 'text-green-400' : isDraw ? 'text-yellow-400' : 'text-text-secondary'}`}>
                        {meeting.homeTeam === homeTeam ? awayScore : homeScore}
                      </span>
                    </div>
                    
                    <span className={`text-sm ${meeting.awayTeam === awayTeam ? 'font-semibold text-white' : 'text-text-secondary'}`}>
                      {meeting.awayTeam === awayTeam ? awayTeam : homeTeam}
                    </span>
                  </div>

                  {/* Venue indicator */}
                  <div className="w-8 flex-shrink-0 text-right">
                    <span className="text-xs text-text-muted" title={meeting.venue}>
                      {meeting.homeTeam === homeTeam ? '🏠' : '✈️'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight */}
        {h2h.homeWins !== h2h.awayWins && (
          <div className="bg-gradient-to-r from-white/5 to-transparent rounded-xl p-3">
            <p className="text-sm text-text-secondary">
              <span className="text-white font-medium">
                {h2h.homeWins > h2h.awayWins ? homeTeam : awayTeam}
              </span>
              {' '}has the edge in head-to-head meetings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
