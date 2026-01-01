/**
 * Infinite League Logos Scroll
 * 
 * Displays supported sports leagues in an infinite horizontal scroll animation.
 * Inspired by Props.cash homepage.
 */

'use client';

import Image from 'next/image';

const leagues = [
  { name: 'Premier League', logo: '⚽', color: '#3C1053' },
  { name: 'La Liga', logo: '⚽', color: '#FF6B00' },
  { name: 'Serie A', logo: '⚽', color: '#024494' },
  { name: 'Bundesliga', logo: '⚽', color: '#D3010C' },
  { name: 'Champions League', logo: '🏆', color: '#00336A' },
  { name: 'NBA', logo: '🏀', color: '#C8102E' },
  { name: 'NFL', logo: '🏈', color: '#013369' },
  { name: 'NHL', logo: '🏒', color: '#000000' },
  { name: 'MLB', logo: '⚾', color: '#041E42' },
  { name: 'UFC', logo: '🥊', color: '#D20A0A' },
  { name: 'Ligue 1', logo: '⚽', color: '#D6E327' },
  { name: 'Euroleague', logo: '🏀', color: '#003399' },
];

export default function LeagueScroll() {
  // Duplicate leagues for seamless infinite scroll
  const duplicatedLeagues = [...leagues, ...leagues];

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
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex gap-8 animate-scroll hover:pause">
            {duplicatedLeagues.map((league, index) => (
              <div
                key={`${league.name}-${index}`}
                className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-accent/30 transition-all duration-300 group"
              >
                {/* League emoji/icon */}
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {league.logo}
                </span>
                {/* League name */}
                <span className="text-sm font-medium text-gray-300 whitespace-nowrap group-hover:text-white transition-colors">
                  {league.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 40s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
