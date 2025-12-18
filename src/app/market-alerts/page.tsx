/**
 * Market Alerts Page - Premium Feature
 * 
 * Redesigned with:
 * - Clear visual hierarchy (Decision → Context → Metadata)
 * - Edge strength indicators with confidence bars
 * - Steam move direction clarity with icons
 * - Market summary brain (sticky insight bar)
 * - Refined color palette (3-level greens/ambers)
 * - Premium micro-interactions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLeagueLogo } from '@/lib/logos';

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
// LEAGUE CONFIG
// ============================================

interface LeagueConfig {
  countryFlag?: string;
  isInternational: boolean;
}

const leagueConfig: Record<string, LeagueConfig> = {
  soccer_epl: { countryFlag: '🇬🇧', isInternational: false },
  soccer_spain_la_liga: { countryFlag: '🇪🇸', isInternational: false },
  soccer_germany_bundesliga: { countryFlag: '🇩🇪', isInternational: false },
  soccer_italy_serie_a: { countryFlag: '🇮🇹', isInternational: false },
  soccer_france_ligue_one: { countryFlag: '🇫🇷', isInternational: false },
  basketball_nba: { isInternational: false },
  icehockey_nhl: { isInternational: false },
  americanfootball_nfl: { isInternational: false },
  basketball_euroleague: { isInternational: true },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEdgeStrength(percent: number): { level: 'strong' | 'moderate' | 'slight'; bars: number; label: string } {
  if (percent >= 8) return { level: 'strong', bars: 5, label: 'Strong Edge' };
  if (percent >= 5) return { level: 'moderate', bars: 4, label: 'Good Edge' };
  if (percent >= 3) return { level: 'slight', bars: 3, label: 'Slight Edge' };
  return { level: 'slight', bars: 2, label: 'Marginal' };
}

function getConfidenceLevel(alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null): { label: string; color: string } {
  switch (alertLevel) {
    case 'HIGH': return { label: 'High', color: 'text-emerald-400' };
    case 'MEDIUM': return { label: 'Medium', color: 'text-amber-400' };
    case 'LOW': return { label: 'Low', color: 'text-blue-400' };
    default: return { label: 'N/A', color: 'text-text-muted' };
  }
}

function getSteamSignal(alert: MarketAlert): { icon: string; label: string; intensity: 'hot' | 'warm' | 'cooling' } {
  const homeChange = Math.abs(alert.homeChange || 0);
  const awayChange = Math.abs(alert.awayChange || 0);
  const maxChange = Math.max(homeChange, awayChange);
  
  // Determine direction
  const direction = alert.changeDirection;
  const team = direction === 'toward_home' ? alert.homeTeam : 
               direction === 'toward_away' ? alert.awayTeam : null;
  
  if (maxChange >= 5) {
    return { icon: '🔥', label: team ? `Heavy money on ${team}` : 'Major line movement', intensity: 'hot' };
  } else if (maxChange >= 3) {
    return { icon: '⚡', label: team ? `Sharp action on ${team}` : 'Sharp money detected', intensity: 'warm' };
  } else {
    return { icon: '📊', label: team ? `Money trickling on ${team}` : 'Slight movement', intensity: 'cooling' };
  }
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Market Summary Brain - Sticky top insight bar
 */
function MarketSummary({ 
  edgeCount, 
  steamCount, 
  matchesScanned,
  lastRefresh 
}: { 
  edgeCount: number; 
  steamCount: number;
  matchesScanned: number;
  lastRefresh: Date | null;
}) {
  const getMarketState = () => {
    if (edgeCount >= 3) return { text: 'Multiple opportunities detected', color: 'text-emerald-400' };
    if (steamCount >= 2) return { text: 'Active sharp money movement', color: 'text-amber-400' };
    if (edgeCount > 0 || steamCount > 0) return { text: 'Light edge activity', color: 'text-blue-400' };
    return { text: 'Markets appear efficient', color: 'text-text-muted' };
  };
  
  const state = getMarketState();
  
  return (
    <div className="bg-gradient-to-r from-bg-card via-bg-card to-bg-card/80 border border-divider rounded-xl p-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Market State */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Market Intelligence</div>
            <div className={`font-semibold ${state.color}`}>{state.text}</div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{edgeCount}</div>
            <div className="text-xs text-text-muted">Value Edges</div>
          </div>
          <div className="w-px h-8 bg-divider"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{steamCount}</div>
            <div className="text-xs text-text-muted">Steam Moves</div>
          </div>
          <div className="w-px h-8 bg-divider hidden sm:block"></div>
          <div className="text-center hidden sm:block">
            <div className="text-sm text-text-secondary">{matchesScanned}</div>
            <div className="text-xs text-text-muted">Scanned</div>
          </div>
        </div>
        
        {/* Last Updated - Subtle */}
        {lastRefresh && (
          <div className="text-xs text-text-muted/60 sm:text-right">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Edge Strength Bar - Visual indicator
 */
function EdgeStrengthBar({ percent, alertLevel }: { percent: number; alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' | null }) {
  const { bars, label } = getEdgeStrength(percent);
  const confidence = getConfidenceLevel(alertLevel);
  
  // Color based on edge strength
  const barColor = percent >= 8 ? 'bg-emerald-400' : 
                   percent >= 5 ? 'bg-emerald-500/80' : 
                   'bg-emerald-600/60';
  
  return (
    <div className="bg-bg-primary/80 rounded-lg p-3 space-y-2">
      {/* Edge Strength */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wider">Edge Strength</span>
        <span className="text-xs font-medium text-emerald-400">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all ${i <= bars ? barColor : 'bg-text-muted/20'}`}
          />
        ))}
      </div>
      
      {/* Confidence */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-text-muted uppercase tracking-wider">Confidence</span>
        <span className={`text-xs font-medium ${confidence.color}`}>{confidence.label}</span>
      </div>
    </div>
  );
}

/**
 * League Header - Faded for context level
 */
function LeagueHeader({ sport, sportTitle }: { sport: string; sportTitle: string }) {
  const config = leagueConfig[sport] || { isInternational: false };
  const leagueLogo = getLeagueLogo(sport);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="flex items-center gap-2 opacity-70">
      {config.countryFlag && !config.isInternational && (
        <span className="text-sm">{config.countryFlag}</span>
      )}
      {!imgError ? (
        <Image
          src={leagueLogo}
          alt={sportTitle}
          width={16}
          height={16}
          className="w-4 h-4 object-contain opacity-80"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span className="w-4 h-4 rounded-full bg-bg-primary/50 flex items-center justify-center text-[10px]">
          {sportTitle.charAt(0)}
        </span>
      )}
      <span className="text-text-muted text-xs font-medium">{sportTitle}</span>
    </div>
  );
}

/**
 * Edge Match Card - Redesigned with visual hierarchy
 */
function EdgeMatchCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const edgeOutcome = alert.bestEdge.outcome;
  const edgePercent = alert.bestEdge.percent;
  const edgeTeam = edgeOutcome === 'home' ? alert.homeTeam : 
                   edgeOutcome === 'away' ? alert.awayTeam : 'Draw';
  
  // Edge color based on strength
  const edgeColor = edgePercent >= 8 ? 'text-emerald-300' : 
                    edgePercent >= 5 ? 'text-emerald-400' : 
                    'text-emerald-500';
  
  return (
    <div className="group bg-bg-card border border-divider rounded-xl p-5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
      {/* Level 3: Context (faded) */}
      <div className="flex items-center justify-between mb-3">
        <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} />
        <span className="text-text-muted/50 text-xs">{matchTime}</span>
      </div>
      
      {/* Level 1: Decision Driver - BIG EDGE */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-4 mb-4 group-hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs text-emerald-400/70 uppercase tracking-wider">Edge Detected</span>
            <div className="font-bold text-text-primary text-lg">{edgeTeam}</div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black ${edgeColor} group-hover:scale-105 transition-transform`}>
              +{edgePercent.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Odds Display */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Odds:</span>
          <span className="font-mono text-text-secondary">
            {edgeOutcome === 'home' ? alert.homeOdds.toFixed(2) : 
             edgeOutcome === 'away' ? alert.awayOdds.toFixed(2) : 
             alert.drawOdds?.toFixed(2)}
          </span>
          <span className="text-text-muted mx-1">→</span>
          <span className="text-text-muted">Model:</span>
          <span className="font-mono text-emerald-400">
            {edgeOutcome === 'home' ? alert.modelHomeProb : 
             edgeOutcome === 'away' ? alert.modelAwayProb : 
             alert.modelDrawProb}%
          </span>
        </div>
      </div>
      
      {/* Level 2: Match Context */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className={`font-medium ${edgeOutcome === 'home' ? 'text-emerald-400' : 'text-text-primary'}`}>
            {alert.homeTeam}
          </span>
          <span className="font-mono text-text-secondary text-sm">{alert.homeOdds.toFixed(2)}</span>
        </div>
        {alert.drawOdds && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${edgeOutcome === 'draw' ? 'text-emerald-400' : 'text-text-muted'}`}>Draw</span>
            <span className="font-mono text-text-muted text-xs">{alert.drawOdds.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className={`font-medium ${edgeOutcome === 'away' ? 'text-emerald-400' : 'text-text-primary'}`}>
            {alert.awayTeam}
          </span>
          <span className="font-mono text-text-secondary text-sm">{alert.awayOdds.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Edge Strength Indicator */}
      <EdgeStrengthBar percent={edgePercent} alertLevel={alert.alertLevel} />
    </div>
  );
}

/**
 * Steam Move Card - Redesigned with direction clarity
 */
function SteamMoveCard({ alert }: { alert: MarketAlert }) {
  const matchTime = new Date(alert.matchDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  // Calculate previous odds
  const homePrevOdds = alert.homeChange && Math.abs(alert.homeChange) > 0.1 
    ? alert.homeOdds / (1 + alert.homeChange / 100) : null;
  const awayPrevOdds = alert.awayChange && Math.abs(alert.awayChange) > 0.1
    ? alert.awayOdds / (1 + alert.awayChange / 100) : null;
  
  const homeHasMove = homePrevOdds !== null;
  const awayHasMove = awayPrevOdds !== null;
  
  // Steam signal
  const signal = getSteamSignal(alert);
  
  // Intensity colors
  const intensityColors = {
    hot: 'from-orange-500/20 via-amber-500/10 to-transparent border-orange-500/30',
    warm: 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/25',
    cooling: 'from-amber-500/10 to-transparent border-amber-500/20',
  };
  
  const badgeColors = {
    hot: 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse',
    warm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cooling: 'bg-amber-500/15 text-amber-500/80 border-amber-500/20',
  };
  
  return (
    <div className="group bg-bg-card border border-amber-500/20 rounded-xl p-5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
      {/* Level 3: Context (faded) */}
      <div className="flex items-center justify-between mb-3">
        <LeagueHeader sport={alert.sport} sportTitle={alert.sportTitle} />
        <span className="text-text-muted/50 text-xs">{matchTime}</span>
      </div>
      
      {/* Level 1: Decision Driver - Steam Signal */}
      <div className={`bg-gradient-to-r ${intensityColors[signal.intensity]} border rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{signal.icon}</span>
            <div>
              <span className={`font-bold text-lg ${signal.intensity === 'hot' ? 'text-orange-400' : 'text-amber-400'}`}>
                {signal.label}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColors[signal.intensity]}`}>
            STEAM
          </span>
        </div>
      </div>
      
      {/* Level 2: Odds Movement - OPEN / NOW / Δ format */}
      <div className="space-y-3 mb-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <span className={`font-medium ${homeHasMove ? 'text-text-primary' : 'text-text-secondary'}`}>
            {alert.homeTeam}
          </span>
          {homeHasMove ? (
            <div className="flex items-center gap-3 font-mono text-sm">
              <div className="text-right">
                <div className="text-text-muted/60 text-[10px] uppercase">Open</div>
                <div className="text-text-muted">{homePrevOdds!.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-text-muted/60 text-[10px] uppercase">Now</div>
                <div className={`font-semibold ${alert.homeChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {alert.homeOdds.toFixed(2)}
                </div>
              </div>
              <div className="text-right min-w-[50px]">
                <div className="text-text-muted/60 text-[10px] uppercase">Δ</div>
                <div className={`font-semibold ${alert.homeChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {alert.homeChange! > 0 ? '+' : ''}{alert.homeChange!.toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <span className="font-mono text-text-muted text-sm">{alert.homeOdds.toFixed(2)}</span>
          )}
        </div>
        
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <span className={`font-medium ${awayHasMove ? 'text-text-primary' : 'text-text-secondary'}`}>
            {alert.awayTeam}
          </span>
          {awayHasMove ? (
            <div className="flex items-center gap-3 font-mono text-sm">
              <div className="text-right">
                <div className="text-text-muted/60 text-[10px] uppercase">Open</div>
                <div className="text-text-muted">{awayPrevOdds!.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-text-muted/60 text-[10px] uppercase">Now</div>
                <div className={`font-semibold ${alert.awayChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {alert.awayOdds.toFixed(2)}
                </div>
              </div>
              <div className="text-right min-w-[50px]">
                <div className="text-text-muted/60 text-[10px] uppercase">Δ</div>
                <div className={`font-semibold ${alert.awayChange! < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {alert.awayChange! > 0 ? '+' : ''}{alert.awayChange!.toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <span className="font-mono text-text-muted text-sm">{alert.awayOdds.toFixed(2)}</span>
          )}
        </div>
      </div>
      
      {/* Alert Note if present */}
      {alert.alertNote && (
        <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          💡 {alert.alertNote}
        </div>
      )}
    </div>
  );
}

/**
 * Steam Legend - Icon guide at top of steam section
 */
function SteamLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-text-muted mb-4 flex-wrap">
      <span className="flex items-center gap-1"><span>🔥</span> Heavy Money</span>
      <span className="flex items-center gap-1"><span>⚡</span> Sharp Action</span>
      <span className="flex items-center gap-1"><span>📊</span> Slight Move</span>
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="container-custom max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-bg-card via-bg-card to-purple-500/5 border border-purple-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">Market Alerts</h1>
          <p className="text-text-secondary text-lg mb-6">
            Real-time odds tracking, steam move detection, and model edge alerts 
            are exclusive to Premium subscribers.
          </p>
          
          <div className="bg-bg-primary/50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-text-primary mb-4 text-center">What you get:</h3>
            <ul className="space-y-3 text-text-secondary max-w-md mx-auto">
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
                Edge strength & confidence indicators
              </li>
              <li className="flex items-center gap-3">
                <span className="text-purple-400">✓</span>
                Market intelligence summary
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
          <div className="h-20 bg-bg-card rounded-xl"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-bg-card rounded w-48"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 bg-bg-card rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-bg-card rounded w-40"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 bg-bg-card rounded-xl"></div>
              ))}
            </div>
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
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [showAllSteam, setShowAllSteam] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market-alerts');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      
      if (!json.success && res.status !== 403) {
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
            <button onClick={fetchAlerts} className="btn-primary">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const { topEdgeMatches = [], steamMoves = [], recentUpdates } = data?.data || {};

  return (
    <div className="min-h-screen bg-bg-primary py-8 sm:py-10">
      <div className="container-custom">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Market Alerts
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              PREMIUM
            </span>
          </div>
          
          <button 
            onClick={fetchAlerts} 
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Market Summary Brain */}
        <MarketSummary 
          edgeCount={topEdgeMatches.length} 
          steamCount={steamMoves.length}
          matchesScanned={recentUpdates?.matchesScanned || 0}
          lastRefresh={lastRefresh}
        />

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Value Edges */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-semibold text-text-primary">Value Edges</h2>
                <span className="text-xs text-text-muted bg-bg-card px-2 py-0.5 rounded-full">
                  Top {Math.min(5, topEdgeMatches.length)}
                </span>
              </div>
              {topEdgeMatches.length > 5 && (
                <button 
                  onClick={() => setShowAllEdges(!showAllEdges)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {showAllEdges ? '← Less' : `All ${topEdgeMatches.length}`}
                </button>
              )}
            </div>
            
            {topEdgeMatches.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-xl p-8 text-center">
                <div className="text-3xl mb-3 opacity-50">📊</div>
                <h3 className="font-semibold text-text-primary mb-1">No Edges Detected</h3>
                <p className="text-text-muted text-sm">Markets appear efficient right now</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllEdges ? topEdgeMatches : topEdgeMatches.slice(0, 5)).map(alert => (
                  <EdgeMatchCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>

          {/* Steam Moves */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <h2 className="text-lg font-semibold text-text-primary">Steam Moves</h2>
                <span className="text-xs text-text-muted bg-bg-card px-2 py-0.5 rounded-full">
                  {steamMoves.length} active
                </span>
              </div>
              {steamMoves.length > 5 && (
                <button 
                  onClick={() => setShowAllSteam(!showAllSteam)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  {showAllSteam ? '← Less' : `All ${steamMoves.length}`}
                </button>
              )}
            </div>
            
            {/* Steam Legend */}
            <SteamLegend />
            
            {steamMoves.length === 0 ? (
              <div className="bg-bg-card/50 border border-divider rounded-xl p-8 text-center">
                <div className="text-3xl mb-3 opacity-50">📉</div>
                <h3 className="font-semibold text-text-primary mb-1">No Steam Detected</h3>
                <p className="text-text-muted text-sm">Sharp money alerts appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(showAllSteam ? steamMoves : steamMoves.slice(0, 5)).map(alert => (
                  <SteamMoveCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Disclaimer - Very subtle */}
        <div className="mt-12 text-center">
          <p className="text-text-muted/50 text-xs">
            ⚠️ Educational purposes only. Model edges are statistical analysis, not guaranteed outcomes. 18+
          </p>
        </div>
      </div>
    </div>
  );
}
