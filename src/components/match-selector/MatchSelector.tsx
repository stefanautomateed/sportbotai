/**
 * Match Selector Component
 * 
 * Main container for the 3-step match selection experience:
 * 1. Select Sport (tabs)
 * 2. Browse Leagues (accordion)
 * 3. Select Match (list)
 * 
 * With global search functionality.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MatchData, AnalyzeRequest, AnalyzeResponse } from '@/types';
import { SPORTS_CONFIG, SportConfig, getSportsGroupedByCategory } from '@/lib/config/sportsConfig';
import SportTabs from './SportTabs';
import MatchSearchBar from './MatchSearchBar';
import LeagueAccordion from './LeagueAccordion';
import MatchPreview from './MatchPreview';
import { groupMatchesByLeague, filterLeagueGroupsBySearch, LeagueGroup } from './utils';

interface MatchSelectorProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function MatchSelector({ onResult, onLoading }: MatchSelectorProps) {
  // API state
  const [apiConfigured, setApiConfigured] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  // Sport selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSportKey, setSelectedSportKey] = useState<string>('');
  const [selectedSportConfig, setSelectedSportConfig] = useState<SportConfig | null>(null);

  // Events state
  const [events, setEvents] = useState<MatchData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MatchData | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Grouped sports
  const groupedSports = useMemo(() => getSportsGroupedByCategory(), []);
  const categories = useMemo(() => Object.keys(groupedSports).sort((a, b) => {
    // Priority order
    const priority: Record<string, number> = {
      'Soccer': 1,
      'Basketball': 2,
      'American Football': 3,
      'Tennis': 4,
      'Ice Hockey': 5,
      'MMA': 6,
    };
    return (priority[a] || 99) - (priority[b] || 99);
  }), [groupedSports]);

  // Sports in selected category
  const sportsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedSports[selectedCategory] || [];
  }, [selectedCategory, groupedSports]);

  // Grouped events by league
  const leagueGroups = useMemo(() => {
    return groupMatchesByLeague(events);
  }, [events]);

  // Filtered league groups by search
  const filteredLeagueGroups = useMemo(() => {
    return filterLeagueGroupsBySearch(leagueGroups, searchQuery);
  }, [leagueGroups, searchQuery]);

  // Total match counts for search UI
  const totalMatches = useMemo(() => events.length, [events]);
  const filteredMatches = useMemo(() => 
    filteredLeagueGroups.reduce((acc, g) => acc + g.matches.length, 0),
    [filteredLeagueGroups]
  );

  // ============================================
  // API CALLS
  // ============================================

  // Check if API is configured on mount
  useEffect(() => {
    async function checkApiStatus() {
      try {
        const response = await fetch('/api/sports');
        if (!response.ok) {
          const data = await response.json();
          if (data.error?.includes('not configured')) {
            setApiConfigured(false);
            setManualMode(true);
          }
        }
      } catch {
        setApiConfigured(false);
        setManualMode(true);
      }
    }
    checkApiStatus();
  }, []);

  // Auto-select first category on load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Fetch events when sport changes
  const fetchEvents = useCallback(async (sportKey: string) => {
    if (!sportKey || manualMode) return;

    setLoadingEvents(true);
    setEvents([]);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);

    try {
      const response = await fetch(`/api/match-data?sportKey=${sportKey}&includeOdds=true`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch events');
      }

      const data = await response.json();

      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      } else {
        setError('No upcoming events found for this league.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Error loading events');
    } finally {
      setLoadingEvents(false);
    }
  }, [manualMode]);

  // Fetch odds for a specific event
  const fetchEventOdds = useCallback(async (sportKey: string, eventId: string) => {
    if (!sportKey || !eventId || manualMode) return;

    setLoadingOdds(true);

    try {
      const response = await fetch(`/api/match-data?sportKey=${sportKey}&eventId=${eventId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch event odds');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSelectedEvent(data.data);
      }
    } catch (err) {
      console.error('Error fetching event odds:', err);
    } finally {
      setLoadingOdds(false);
    }
  }, [manualMode]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSportKey('');
    setSelectedSportConfig(null);
    setEvents([]);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);
  };

  const handleLeagueSelect = (sportKey: string) => {
    setSelectedSportKey(sportKey);
    setSelectedEvent(null);
    setSearchQuery('');
    setError(null);

    const config = Object.values(SPORTS_CONFIG).find(c => c.oddsApiSportKey === sportKey);
    setSelectedSportConfig(config || null);

    if (sportKey && !manualMode) {
      fetchEvents(sportKey);
    }
  };

  const handleMatchSelect = (match: MatchData) => {
    setSelectedEvent(match);

    // If event doesn't have odds, fetch them
    if (!match.odds || match.odds.home === 0) {
      fetchEventOdds(selectedSportKey, match.matchId);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedEvent) return;

    setLoadingAnalysis(true);
    onLoading(true);
    setError(null);

    const data: AnalyzeRequest = {
      matchData: {
        sport: selectedSportConfig?.displayName || 'Soccer',
        league: selectedEvent.league,
        homeTeam: selectedEvent.homeTeam,
        awayTeam: selectedEvent.awayTeam,
        sourceType: 'API',
        matchDate: selectedEvent.commenceTime,
        odds: {
          home: selectedEvent.odds?.home || 0,
          draw: selectedEvent.odds?.draw,
          away: selectedEvent.odds?.away || 0,
        },
      },
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoadingAnalysis(false);
      onLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Manual mode fallback (simplified)
  if (manualMode) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
        <strong>Note:</strong> Live data not available. Please configure ODDS_API_KEY.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Sport Selection */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          1. Select Sport
        </h2>
        <SportTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          loading={loadingEvents}
        />
      </div>

      {/* League Pills (sub-selection within category) */}
      {selectedCategory && sportsInCategory.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            2. Select League
          </h2>
          <div className="flex flex-wrap gap-2">
            {sportsInCategory.map((sport) => {
              const isSelected = sport.oddsApiSportKey === selectedSportKey;
              return (
                <button
                  key={sport.oddsApiSportKey}
                  onClick={() => handleLeagueSelect(sport.oddsApiSportKey)}
                  disabled={loadingEvents}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isSelected
                      ? 'bg-accent-cyan text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    ${loadingEvents ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {sport.displayName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Match Selection (with search) */}
      {selectedSportKey && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Match Browser */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                3. Select Match
              </h2>
              {events.length > 0 && (
                <span className="text-xs text-gray-400">
                  {events.length} matches available
                </span>
              )}
            </div>

            {/* Search Bar */}
            <MatchSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              disabled={loadingEvents || events.length === 0}
              totalMatches={totalMatches}
              filteredMatches={filteredMatches}
            />

            {/* Error Message */}
            {error && !loadingEvents && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loadingEvents && (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-3 border-accent-cyan border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading matches...</p>
              </div>
            )}

            {/* League Accordion */}
            {!loadingEvents && events.length > 0 && (
              <LeagueAccordion
                leagues={filteredLeagueGroups}
                selectedMatchId={selectedEvent?.matchId}
                onMatchSelect={handleMatchSelect}
                searchQuery={searchQuery}
                defaultExpanded={leagueGroups.length === 1}
              />
            )}

            {/* Empty state */}
            {!loadingEvents && events.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏟️</span>
                </div>
                <p className="text-gray-500 text-sm">
                  Select a league to view available matches
                </p>
              </div>
            )}
          </div>

          {/* Right: Match Preview */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <MatchPreview
                match={selectedEvent}
                sportConfig={selectedSportConfig}
                onAnalyze={handleAnalyze}
                loading={loadingAnalysis}
                loadingOdds={loadingOdds}
              />
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">No Match Selected</h3>
                <p className="text-gray-500 text-sm">
                  Select a match from the list to see odds and run analysis
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial state - no league selected */}
      {!selectedSportKey && selectedCategory && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👆</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Select a League</h3>
          <p className="text-gray-500 text-sm">
            Choose a league above to browse available matches
          </p>
        </div>
      )}
    </div>
  );
}
