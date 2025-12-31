/**
 * Serbian My Teams Dashboard
 * Prikazuje omiljene timove korisnika i predstojeće utakmice
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import TeamLogo from '@/components/ui/TeamLogo';
import { useFavorites } from '@/lib/FavoritesContext';

interface UpcomingMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  sport: string;
}

export default function MyTeamsDashboardSr() {
  const { data: session, status } = useSession();
  const { favorites, removeFavorite, isLoading: favoritesLoading } = useFavorites();
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Fetch upcoming matches for favorite teams
  useEffect(() => {
    if (favorites.length === 0) return;

    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const teamNames = favorites.map(f => f.teamName).join(',');
        const res = await fetch(`/api/matches/favorites?teams=${encodeURIComponent(teamNames)}`);
        if (res.ok) {
          const data = await res.json();
          setUpcomingMatches(data.matches || []);
        }
      } catch (error) {
        console.error('Greška pri učitavanju utakmica:', error);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [favorites]);

  if (status === 'loading' || favoritesLoading) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-bg-card rounded w-48"></div>
            <div className="h-32 bg-bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="bg-bg-card rounded-card border border-divider p-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-4">
              Moji Timovi
            </h1>
            <p className="text-text-secondary mb-6">
              Prijavite se da biste pratili vaše omiljene timove.
            </p>
            <Link
              href="/sr/login?callbackUrl=/sr/my-teams"
              className="btn-primary inline-block"
            >
              Prijavi se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Moji Timovi
            </h1>
            <p className="text-text-secondary">
              {favorites.length} {favorites.length === 1 ? 'tim' : favorites.length < 5 ? 'tima' : 'timova'} pratite
            </p>
          </div>
          <Link 
            href="/my-teams" 
            className="text-sm text-slate-500 hover:text-primary transition-colors"
          >
            🌐 English
          </Link>
        </div>

        {favorites.length === 0 ? (
          /* Empty State */
          <div className="bg-bg-card rounded-card border border-divider p-8 text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Nemate omiljenih timova
            </h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Dodajte timove u omiljene sa stranice utakmica da biste ih pratili ovde.
            </p>
            <Link
              href="/sr/matches"
              className="btn-primary inline-block"
            >
              Pregledaj Utakmice
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorite Teams Grid */}
            <div className="bg-bg-card rounded-card border border-divider p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Omiljeni Timovi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-bg-primary rounded-lg border border-divider"
                  >
                    <div className="flex items-center gap-3">
                      <TeamLogo
                        teamName={team.teamName}
                        sport={team.sport}
                        size="lg"
                      />
                      <div>
                        <p className="font-medium text-text-primary">{team.teamName}</p>
                        <p className="text-xs text-text-tertiary capitalize">{team.sport}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavorite(team.teamName, team.sport)}
                      className="text-text-tertiary hover:text-danger transition-colors p-2"
                      title="Ukloni iz omiljenih"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="bg-bg-card rounded-card border border-divider p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Predstojeće Utakmice
              </h2>
              
              {loadingMatches ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-bg-primary rounded"></div>
                  <div className="h-16 bg-bg-primary rounded"></div>
                </div>
              ) : upcomingMatches.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  Nema predstojećih utakmica za vaše omiljene timove.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <Link
                      key={match.matchId}
                      href={`/sr/match/${match.matchId}`}
                      className="flex items-center justify-between p-4 bg-bg-primary rounded-lg border border-divider hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={match.homeTeam} sport={match.sport} size="md" />
                          <span className="text-text-primary font-medium">{match.homeTeam}</span>
                        </div>
                        <span className="text-text-tertiary">vs</span>
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={match.awayTeam} sport={match.sport} size="md" />
                          <span className="text-text-primary font-medium">{match.awayTeam}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">{match.league}</p>
                        <p className="text-xs text-text-tertiary">
                          {new Date(match.matchDate).toLocaleDateString('sr-RS', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
