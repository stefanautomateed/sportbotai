/**
 * Match Browser Component
 * 
 * Browse matches by league/sport with filters.
 * Links to Match Preview pages.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { MatchData } from '@/types';
import { SPORTS_CONFIG, getSportsGroupedByCategory } from '@/lib/config/sportsConfig';
import MatchCard from '@/components/MatchCard';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface MatchBrowserProps {
  initialSport?: string;
  maxMatches?: number;
}

// Popular leagues to show by default
const POPULAR_LEAGUES = [
  { key: 'soccer_epl', name: 'Premier League', sport: 'soccer' },
  { key: 'soccer_spain_la_liga', name: 'La Liga', sport: 'soccer' },
  { key: 'soccer_germany_bundesliga', name: 'Bundesliga', sport: 'soccer' },
  { key: 'soccer_italy_serie_a', name: 'Serie A', sport: 'soccer' },
  { key: 'soccer_uefa_champs_league', name: 'Champions League', sport: 'soccer' },
  { key: 'basketball_nba', name: 'NBA', sport: 'basketball' },
  { key: 'americanfootball_nfl', name: 'NFL', sport: 'americanfootball' },
  { key: 'icehockey_nhl', name: 'NHL', sport: 'hockey' },
];

export default function MatchBrowser({ initialSport, maxMatches = 12 }: MatchBrowserProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>(initialSport || 'soccer_epl');
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllLeagues, setShowAllLeagues] = useState(false);

  const groupedSports = useMemo(() => getSportsGroupedByCategory(), []);

  // Fetch matches for selected league
  useEffect(() => {
    async function fetchMatches() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        setMatches(data.events || []);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
        setError('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, [selectedLeague]);

  // Get current league info
  const currentLeague = POPULAR_LEAGUES.find(l => l.key === selectedLeague) || {
    key: selectedLeague,
    name: SPORTS_CONFIG[selectedLeague]?.displayName || selectedLeague,
    sport: selectedLeague.split('_')[0],
  };

  // Get all leagues for expanded view
  const allLeagues = useMemo(() => {
    const leagues: Array<{ key: string; name: string; category: string }> = [];
    Object.entries(groupedSports).forEach(([category, sports]) => {
      sports.forEach(sport => {
        leagues.push({
          key: sport.oddsApiSportKey,
          name: sport.displayName,
          category,
        });
      });
    });
    return leagues;
  }, [groupedSports]);

  return (
    <section id="browse" className="py-12 sm:py-16 bg-bg-secondary scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Browse by League</h2>
              <p className="text-sm text-gray-400">All upcoming matches</p>
            </div>
          </div>
          <button
            onClick={() => setShowAllLeagues(!showAllLeagues)}
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            {showAllLeagues ? 'Show less' : 'All leagues'}
            <svg className={`w-4 h-4 transition-transform ${showAllLeagues ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* League Pills - Popular */}
        <div className="flex flex-wrap gap-2 mb-6">
          {POPULAR_LEAGUES.map((league) => (
            <button
              key={league.key}
              onClick={() => setSelectedLeague(league.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLeague === league.key
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
              <span>{league.name}</span>
            </button>
          ))}
        </div>

        {/* All Leagues Expanded */}
        {showAllLeagues && (
          <div className="mb-8 p-4 bg-white/5 rounded-xl">
            {Object.entries(groupedSports).map(([category, sports]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <button
                      key={sport.oddsApiSportKey}
                      onClick={() => {
                        setSelectedLeague(sport.oddsApiSportKey);
                        setShowAllLeagues(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLeague === sport.oddsApiSportKey
                          ? 'bg-primary text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                      }`}
                    >
                      {sport.displayName}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current League Header */}
        <div className="flex items-center gap-3 mb-4">
          <LeagueLogo leagueName={currentLeague.name} sport={selectedLeague} size="md" />
          <h3 className="text-lg font-semibold text-white">{currentLeague.name}</h3>
          <span className="text-sm text-text-muted">
            {isLoading ? 'Loading...' : `${matches.length} matches`}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[160px] rounded-xl bg-bg-card animate-pulse border border-divider" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => setSelectedLeague(selectedLeague)} 
              className="btn-secondary"
            >
              Try again
            </button>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !error && matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.slice(0, maxMatches).map((match) => (
              <MatchCard
                key={match.matchId}
                matchId={match.matchId}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                league={currentLeague.name}
                sportKey={selectedLeague}
                commenceTime={match.commenceTime}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No upcoming matches in {currentLeague.name}</p>
            <p className="text-sm text-text-muted">Try selecting a different league</p>
          </div>
        )}

        {/* Show More */}
        {!isLoading && matches.length > maxMatches && (
          <div className="text-center mt-6">
            <button 
              onClick={() => {/* Could expand or link to full page */}}
              className="btn-secondary"
            >
              View all {matches.length} matches
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
