/**
 * Market Alerts Page
 * 
 * Premium-only feature showing:
 * - Top 5 matches with highest model edge
 * - Steam moves and sharp money detection
 * - Real-time odds tracking
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface MarketAlert {
  id: string;
  matchRef: string;
  sport: string;
  sportTitle: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
  homeChange?: number;
  awayChange?: number;
  drawChange?: number;
  changeDirection: 'toward_home' | 'toward_away' | 'stable';
  modelHomeProb: number;
  modelAwayProb: number;
  modelDrawProb?: number;
  homeEdge: number;
  awayEdge: number;
  drawEdge?: number;
  bestEdge: {
    outcome: 'home' | 'away' | 'draw';
    percent: number;
    label: string;
  };
  hasSteamMove: boolean;
  hasValueEdge: boolean;
  alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  alertNote?: string;
}

interface MarketAlertsResponse {
  success: boolean;
  data?: {
    topEdgeMatches: MarketAlert[];
    steamMoves: MarketAlert[];
    recentUpdates: {
      lastFetch: string;
      matchesScanned: number;
      alertsGenerated: number;
    };
  };
  error?: string;
  isPremium: boolean;
}

// ============================================
// SPORT ICONS
// ============================================

const sportEmojis: Record<string, string> = {
  soccer_epl: '⚽',
  soccer_spain_la_liga: '⚽',
  soccer_germany_bundesliga: '⚽',
  soccer_italy_serie_a: '⚽',
  soccer_france_ligue_one: '⚽',
  basketball_nba: '🏀',
  basketball_euroleague: '🏀',
  icehockey_nhl: '🏒',
  americanfootball_nfl: '🏈',
};

// ============================================
// COMPONENTS
// ============================================

function AlertBadge({ level }: { level: 'HIGH' | 'MEDIUM' | 'LOW' | null }) {
  if (!level) return null;
  
  const styles = {
    HIGH: 'bg-green-500/20 text-green-400 border-green-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level}
    </span>
  );
}

function EdgeMatchCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const sportEmoji = sportEmojis[alert.sport] || '🎯';
  
  // Determine which outcome has edge
  const edgeOutcome = alert.bestEdge.outcome;
  const edgePercent = alert.bestEdge.percent;
  
  return (
    <div className="bg-bg-card border border-divider rounded-xl p-5 hover:border-accent/30 transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{sportEmoji}</span>
          <span className="text-text-secondary text-sm font-medium">{alert.sportTitle}</span>
        </div>
        <AlertBadge level={alert.alertLevel} />
      </div>
      
      {/* Teams */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`font-semibold ${edgeOutcome === 'home' ? 'text-green-400' : 'text-text-primary'}`}>
            {alert.homeTeam}
            {edgeOutcome === 'home' && <span className="ml-2 text-green-400 text-sm">← EDGE</span>}
          </span>
          <span className="text-text-secondary font-mono">{alert.homeOdds.toFixed(2)}</span>
        </div>
        {alert.drawOdds && (
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${edgeOutcome === 'draw' ? 'text-green-400' : 'text-text-muted'}`}>
              Draw
              {edgeOutcome === 'draw' && <span className="ml-2 text-green-400 text-xs">← EDGE</span>}
            </span>
            <span className="text-text-muted font-mono text-sm">{alert.drawOdds.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${edgeOutcome === 'away' ? 'text-green-400' : 'text-text-primary'}`}>
            {alert.awayTeam}
            {edgeOutcome === 'away' && <span className="ml-2 text-green-400 text-sm">← EDGE</span>}
          </span>
          <span className="text-text-secondary font-mono">{alert.awayOdds.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Edge Display */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-semibold">Model Edge</span>
          <span className="text-green-400 font-bold text-lg">+{edgePercent.toFixed(1)}%</span>
        </div>
        <div className="text-text-muted text-sm mt-1">
          on {edgeOutcome.charAt(0).toUpperCase() + edgeOutcome.slice(1)}
        </div>
      </div>
      
      {/* Model Probabilities */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
        <div className="bg-bg-primary/50 rounded-lg p-2">
          <div className="text-text-muted text-xs mb-1">Home</div>
          <div className="font-semibold text-text-primary">{alert.modelHomeProb}%</div>
        </div>
        {alert.modelDrawProb !== undefined && (
          <div className="bg-bg-primary/50 rounded-lg p-2">
            <div className="text-text-muted text-xs mb-1">Draw</div>
            <div className="font-semibold text-text-primary">{alert.modelDrawProb}%</div>
          </div>
        )}
        <div className="bg-bg-primary/50 rounded-lg p-2">
          <div className="text-text-muted text-xs mb-1">Away</div>
          <div className="font-semibold text-text-primary">{alert.modelAwayProb}%</div>
        </div>
      </div>
      
      {/* Match Time */}
      <div className="text-text-muted text-sm text-center">
        {matchTime}
      </div>
    </div>
  );
}

function SteamMoveCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const sportEmoji = sportEmojis[alert.sport] || '🎯';
  
  const direction = alert.changeDirection;
  const directionLabel = direction === 'toward_home' ? 'Sharp money on Home' :
                        direction === 'toward_away' ? 'Sharp money on Away' : 'Stable';
  
  return (
    <div className="bg-bg-card border border-amber-500/30 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{sportEmoji}</span>
          <span className="text-text-secondary text-sm font-medium">{alert.sportTitle}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          ⚡ STEAM
        </span>
      </div>
      
      {/* Teams */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-text-primary">{alert.homeTeam}</span>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary font-mono">{alert.homeOdds.toFixed(2)}</span>
            {alert.homeChange && (
              <span className={`text-sm font-mono ${alert.homeChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                {alert.homeChange > 0 ? '+' : ''}{alert.homeChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-primary">{alert.awayTeam}</span>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary font-mono">{alert.awayOdds.toFixed(2)}</span>
            {alert.awayChange && (
              <span className={`text-sm font-mono ${alert.awayChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                {alert.awayChange > 0 ? '+' : ''}{alert.awayChange.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Steam Note */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <span className="text-amber-400 text-sm font-medium">{alert.alertNote || directionLabel}</span>
        </div>
      </div>
      
      {/* Match Time */}
      <div className="text-text-muted text-sm text-center">
        {matchTime}
      </div>
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom max-w-2xl">
        <div className="bg-gradient-to-br from-bg-card via-bg-card to-purple-500/5 border border-purple-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Market Alerts
          </h1>
          <p className="text-text-secondary text-lg mb-6">
            Real-time odds tracking, steam move detection, and model edge alerts 
            are exclusive to Premium subscribers.
          </p>
          
          <div className="bg-bg-primary/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-text-primary mb-4">What you get:</h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Top 5 matches with highest model edge
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Steam move detection (sharp money alerts)
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Real-time odds movement tracking
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Model probability vs market comparison
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Automatic refresh every 15 minutes
              </li>
            </ul>
          </div>
          
          <Link href="/pricing" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors">
            Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-bg-card rounded-lg w-64"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-bg-card rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function MarketAlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MarketAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market-alerts');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      
      if (!json.success && res.status === 403) {
        // Premium gate will be shown
      } else if (!json.success) {
        setError(json.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Failed to load market alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/market-alerts');
      return;
    }

    if (status === 'authenticated') {
      fetchAlerts();
    }
  }, [status, router, fetchAlerts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!data?.isPremium) return;
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [data?.isPremium, fetchAlerts]);

  if (status === 'loading' || (loading && !data)) {
    return <LoadingState />;
  }

  // Show premium gate for non-premium users
  if (data && !data.isPremium) {
    return <PremiumGate />;
  }

  if (error && !data?.data) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="container-custom">
          <div className="bg-bg-card border border-danger/30 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-secondary mb-4">{error}</p>
            <button onClick={fetchAlerts} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { topEdgeMatches = [], steamMoves = [], recentUpdates } = data?.data || {};

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Market Alerts
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                PREMIUM
              </span>
            </div>
            <p className="text-text-secondary">
              Real-time odds tracking and model edge detection
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {recentUpdates && (
              <div className="text-text-muted text-sm">
                {recentUpdates.matchesScanned} matches scanned • {recentUpdates.alertsGenerated} alerts
              </div>
            )}
            <button 
              onClick={fetchAlerts} 
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {lastRefresh && (
          <div className="text-text-muted text-sm mb-6">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}

        {/* Two Column Layout - Value Edges & Steam Moves Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Edge Matches */}
          <section className="bg-bg-card/50 border border-divider rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-semibold text-text-primary">Top Value Edges</h2>
              <span className="text-text-muted text-sm">({topEdgeMatches.length})</span>
            </div>
            
            {topEdgeMatches.length === 0 ? (
              <div className="bg-bg-primary/50 border border-divider rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Value Edges Found</h3>
                <p className="text-text-secondary text-sm">
                  Edges will appear when model finds value.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topEdgeMatches.map(alert => (
                  <EdgeMatchCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>

          {/* Steam Moves */}
          <section className="bg-bg-card/50 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-semibold text-text-primary">Steam Moves</h2>
              <span className="text-text-muted text-sm">({steamMoves.length})</span>
            </div>
            
            {steamMoves.length === 0 ? (
              <div className="bg-bg-primary/50 border border-divider rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">📉</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Steam Moves Detected</h3>
                <p className="text-text-secondary text-sm">
                  Sharp money alerts (3%+ odds changes) appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {steamMoves.map(alert => (
                  <SteamMoveCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-bg-card border border-divider rounded-lg">
          <p className="text-text-muted text-sm text-center">
            ⚠️ Market alerts are for educational purposes only. Model edges represent statistical 
            analysis, not guaranteed outcomes. Always gamble responsibly. 18+
          </p>
        </div>
      </div>
    </div>
  );
}
