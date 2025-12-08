/**
 * Match Selector Utilities
 * 
 * Helper functions for grouping, filtering, and processing match data.
 */

import { MatchData } from '@/types';
import { SportConfig } from '@/lib/config/sportsConfig';

/**
 * Group matches by their league
 */
export interface LeagueGroup {
  leagueKey: string;
  leagueName: string;
  sportKey: string;
  matches: MatchData[];
}

export function groupMatchesByLeague(matches: MatchData[]): LeagueGroup[] {
  const groups = new Map<string, LeagueGroup>();

  for (const match of matches) {
    const key = match.league || match.sportKey || 'unknown';
    
    if (!groups.has(key)) {
      groups.set(key, {
        leagueKey: key,
        leagueName: match.league || 'Unknown League',
        sportKey: match.sportKey,
        matches: [],
      });
    }
    
    groups.get(key)!.matches.push(match);
  }

  // Sort matches within each group by commence time
  const groupValues = Array.from(groups.values());
  for (const group of groupValues) {
    group.matches.sort((a, b) => 
      new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime()
    );
  }

  // Return groups sorted by league name
  return groupValues.sort((a, b) => 
    a.leagueName.localeCompare(b.leagueName)
  );
}

/**
 * Filter matches by search query (team name)
 */
export function filterMatchesBySearch(
  matches: MatchData[], 
  query: string
): MatchData[] {
  if (!query.trim()) return matches;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return matches.filter(match => 
    match.homeTeam.toLowerCase().includes(lowerQuery) ||
    match.awayTeam.toLowerCase().includes(lowerQuery) ||
    match.league.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter league groups by search query
 */
export function filterLeagueGroupsBySearch(
  groups: LeagueGroup[],
  query: string
): LeagueGroup[] {
  if (!query.trim()) return groups;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return groups
    .map(group => ({
      ...group,
      matches: group.matches.filter(match =>
        match.homeTeam.toLowerCase().includes(lowerQuery) ||
        match.awayTeam.toLowerCase().includes(lowerQuery)
      ),
    }))
    .filter(group => group.matches.length > 0);
}

/**
 * Format date for display
 */
export function formatMatchDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  if (isTomorrow) {
    return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format short date (for compact display)
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format time only
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get sport icon by category
 */
export function getSportIcon(category: string): string {
  const icons: Record<string, string> = {
    'Soccer': '⚽',
    'Basketball': '🏀',
    'American Football': '🏈',
    'Tennis': '🎾',
    'Ice Hockey': '🏒',
    'Baseball': '⚾',
    'MMA': '🥊',
    'Boxing': '🥊',
    'Cricket': '🏏',
    'Rugby': '🏉',
    'Golf': '⛳',
  };
  return icons[category] || '🏆';
}

/**
 * Get category display info
 */
export interface CategoryDisplay {
  id: string;
  name: string;
  icon: string;
  shortName: string;
}

export function getCategoryDisplayInfo(category: string): CategoryDisplay {
  const info: Record<string, CategoryDisplay> = {
    'Soccer': { id: 'soccer', name: 'Soccer', icon: '⚽', shortName: 'Soccer' },
    'Basketball': { id: 'basketball', name: 'Basketball', icon: '🏀', shortName: 'NBA' },
    'American Football': { id: 'american-football', name: 'American Football', icon: '🏈', shortName: 'NFL' },
    'Tennis': { id: 'tennis', name: 'Tennis', icon: '🎾', shortName: 'Tennis' },
    'Ice Hockey': { id: 'ice-hockey', name: 'Ice Hockey', icon: '🏒', shortName: 'NHL' },
    'MMA': { id: 'mma', name: 'MMA', icon: '🥊', shortName: 'UFC' },
  };
  
  return info[category] || { 
    id: category.toLowerCase().replace(/\s+/g, '-'), 
    name: category, 
    icon: '🏆',
    shortName: category,
  };
}
