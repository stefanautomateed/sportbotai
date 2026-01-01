/**
 * Infinite League Logos Scroll
 * 
 * Displays supported sports leagues in an infinite horizontal scroll animation.
 * Uses real league logos from our app's logo library.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

const leagues = [
  { name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', key: 'soccer_epl' },
  { name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', key: 'soccer_spain_la_liga' },
  { name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', key: 'soccer_italy_serie_a' },
  { name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', key: 'soccer_germany_bundesliga' },
  { name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png', key: 'soccer_france_ligue_one' },
  { name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', key: 'soccer_uefa_champs_league' },
  { name: 'NBA', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png', key: 'basketball_nba' },
  { name: 'NFL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png', key: 'americanfootball_nfl' },
  { name: 'NHL', logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png', key: 'icehockey_nhl' },
  { name: 'EuroLeague', logo: 'https://media.api-sports.io/basketball/leagues/120.png', key: 'basketball_euroleague' },
];

export default function LeagueScroll() {
  // Triple duplicate for smoother infinite scroll
  const duplicatedLeagues = [...leagues, ...leagues, ...leagues];

  return (
    <section className="py-8 bg-bg-primary border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="text-center mb-6">
          <span className="text-accent text-xs font-semibold uppercase tracking-wider">
            Sports Coverage
          </span>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex gap-8 animate-league-scroll">
            {duplicatedLeagues.map((league, index) => (
              <Link
                key={`${league.name}-${index}`}
                href={`/matches?league=${league.key}`}
                className="flex-shrink-0 flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-accent/30 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
              >
                {/* League logo with white background for visibility */}
                <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded-lg p-1.5">
                  <Image
                    src={league.logo}
                    alt={`${league.name} logo`}
                    fill
                    className="object-contain group-hover:scale-110 transition-transform duration-300 p-0.5"
                    unoptimized
                  />
                </div>
                {/* League name */}
                <span className="text-base font-semibold text-gray-300 whitespace-nowrap group-hover:text-white transition-colors">
                  {league.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
