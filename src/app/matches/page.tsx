/**
 * Matches Page (/matches)
 * 
 * Browse all upcoming matches by league.
 * The main match discovery page.
 */

import { Metadata } from 'next';
import MatchBrowser from '@/components/MatchBrowser';

export const metadata: Metadata = {
  title: 'Browse Matches | SportBot AI',
  description: 'Browse upcoming matches across all leagues. Get pre-match intelligence for Premier League, La Liga, NBA, NFL, and more.',
};

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Browse Matches
              </h1>
              <p className="text-text-secondary text-sm">
                Select any upcoming match to get your pre-match intelligence briefing
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Live data from 17+ sports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Match Browser */}
      <MatchBrowser maxMatches={24} />
    </div>
  );
}
