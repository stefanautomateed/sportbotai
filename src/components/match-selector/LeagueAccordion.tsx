/**
 * League Accordion Component
 * 
 * Expandable sections for each league.
 * Shows league name as header, matches inside when expanded.
 */

'use client';

import { useState, useEffect } from 'react';
import { MatchData } from '@/types';
import { LeagueGroup, getSportIcon } from './utils';
import MatchList from './MatchList';

interface LeagueAccordionProps {
  leagues: LeagueGroup[];
  selectedMatchId?: string;
  onMatchSelect: (match: MatchData) => void;
  loading?: boolean;
  defaultExpanded?: boolean;
  searchQuery?: string;
}

export default function LeagueAccordion({
  leagues,
  selectedMatchId,
  onMatchSelect,
  loading = false,
  defaultExpanded = false,
  searchQuery = '',
}: LeagueAccordionProps) {
  // Track which leagues are expanded
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  // Auto-expand when searching or when there's only one league
  useEffect(() => {
    if (searchQuery.trim() || leagues.length === 1) {
      setExpandedLeagues(new Set(leagues.map(l => l.leagueKey)));
    } else if (defaultExpanded) {
      setExpandedLeagues(new Set(leagues.map(l => l.leagueKey)));
    }
  }, [searchQuery, leagues, defaultExpanded]);

  // Auto-expand league containing selected match
  useEffect(() => {
    if (selectedMatchId) {
      const league = leagues.find(l => 
        l.matches.some(m => m.matchId === selectedMatchId)
      );
      if (league) {
        setExpandedLeagues(prev => new Set([...Array.from(prev), league.leagueKey]));
      }
    }
  }, [selectedMatchId, leagues]);

  const toggleLeague = (leagueKey: string) => {
    setExpandedLeagues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leagueKey)) {
        newSet.delete(leagueKey);
      } else {
        newSet.add(leagueKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-14 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">
          {searchQuery ? 'No matches found for your search' : 'No leagues available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leagues.map((league) => {
        const isExpanded = expandedLeagues.has(league.leagueKey);
        const matchCount = league.matches.length;
        const hasSelectedMatch = league.matches.some(m => m.matchId === selectedMatchId);

        return (
          <div
            key={league.leagueKey}
            className={`
              border rounded-xl overflow-hidden transition-all duration-200
              ${hasSelectedMatch ? 'border-accent-cyan shadow-sm' : 'border-gray-200'}
            `}
          >
            {/* League Header */}
            <button
              onClick={() => toggleLeague(league.leagueKey)}
              className={`
                w-full flex items-center justify-between p-4 text-left
                transition-colors duration-200
                ${isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getSportIcon(league.sportKey)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{league.leagueName}</h3>
                  <p className="text-xs text-gray-500">
                    {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasSelectedMatch && (
                  <span className="text-xs px-2 py-1 bg-accent-cyan/10 text-accent-cyan rounded-full font-medium">
                    Selected
                  </span>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Matches */}
            {isExpanded && (
              <div className="px-4 pb-4 bg-gray-50">
                <MatchList
                  matches={league.matches}
                  selectedMatchId={selectedMatchId}
                  onMatchSelect={onMatchSelect}
                  compact
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
