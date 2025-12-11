/**
 * Sport Insights Card Component
 * 
 * Sport-specific insights that highlight what matters most
 * for each type of sport. Automatically adapts content:
 * 
 * - Soccer: Set pieces, pressing, possession style
 * - Basketball: Pace, 3PT shooting, rest advantage
 * - NFL: Weather, red zone, turnovers
 * - Tennis: Surface, serve stats, fitness
 * 
 * Uses AI tactical analysis + sport-specific highlighting.
 */

'use client';

import { AnalyzeResponse } from '@/types';

interface SportInsightsCardProps {
  result: AnalyzeResponse;
}

// Sport-specific insight templates
const SPORT_INSIGHTS: Record<string, {
  icon: string;
  title: string;
  aspectLabels: string[];
  insights: string[];
}> = {
  soccer: {
    icon: '⚽',
    title: 'Soccer Insights',
    aspectLabels: ['Set Pieces', 'Pressing', 'Possession', 'Counter-Attack'],
    insights: [
      'Home advantage is significant in soccer (≈10% boost)',
      'Check for key player injuries/suspensions',
      'Consider fixture congestion & fatigue',
      'European games mid-week can affect weekend form',
    ],
  },
  basketball: {
    icon: '🏀',
    title: 'Basketball Insights',
    aspectLabels: ['Pace', '3PT Shooting', 'Defense', 'Rebounding'],
    insights: [
      'Back-to-back games heavily impact performance',
      'Home court advantage is 3-5 points',
      'Check for load management on star players',
      'Fast-paced teams favor the over',
    ],
  },
  nba: {
    icon: '🏀',
    title: 'NBA Insights',
    aspectLabels: ['Pace', '3PT%', 'Def Rating', 'Rest Days'],
    insights: [
      'B2B games: expect 3-5% drop in performance',
      'Travel schedule matters (coast-to-coast)',
      'Star player rest is common in regular season',
      'Playoff seeding impacts late-season motivation',
    ],
  },
  nfl: {
    icon: '🏈',
    title: 'NFL Insights',
    aspectLabels: ['Red Zone', 'Turnovers', 'Time of Possession', 'Weather'],
    insights: [
      'Weather heavily impacts passing games',
      'Divisional games are often closer',
      'Prime time games can be unpredictable',
      'Bye weeks provide significant rest advantage',
    ],
  },
  tennis: {
    icon: '🎾',
    title: 'Tennis Insights',
    aspectLabels: ['Surface', 'Serve', 'Return', 'Fitness'],
    insights: [
      'Surface specialists can outperform rankings',
      'Recent match load affects performance',
      'H2H is more predictive than rankings',
      'First-set momentum often carries through',
    ],
  },
  hockey: {
    icon: '🏒',
    title: 'NHL Insights',
    aspectLabels: ['Power Play', 'Penalty Kill', 'Goaltending', 'Shot Quality'],
    insights: [
      'Goalie matchups are crucial',
      'B2B games impact NHL significantly',
      'Road trips wear teams down',
      'Special teams can swing outcomes',
    ],
  },
  mma: {
    icon: '🥊',
    title: 'MMA Insights',
    aspectLabels: ['Striking', 'Grappling', 'Cardio', 'Fight IQ'],
    insights: [
      'Style matchups matter more than records',
      'Weight cut can impact performance',
      'Camp/coaching changes are significant',
      'Layoffs affect fighters differently',
    ],
  },
  default: {
    icon: '📊',
    title: 'Match Insights',
    aspectLabels: ['Form', 'Matchup', 'Conditions', 'History'],
    insights: [
      'Recent form is a strong predictor',
      'Home advantage varies by sport',
      'Check for any unusual circumstances',
      'Historical H2H provides context',
    ],
  },
};

// Get sport config with fallback
function getSportInsightsConfig(sport: string) {
  const normalized = sport.toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.includes('soccer') || (normalized.includes('football') && !normalized.includes('american'))) {
    return SPORT_INSIGHTS.soccer;
  }
  if (normalized.includes('nba')) {
    return SPORT_INSIGHTS.nba;
  }
  if (normalized.includes('basketball')) {
    return SPORT_INSIGHTS.basketball;
  }
  if (normalized.includes('nfl') || normalized.includes('american')) {
    return SPORT_INSIGHTS.nfl;
  }
  if (normalized.includes('tennis')) {
    return SPORT_INSIGHTS.tennis;
  }
  if (normalized.includes('hockey') || normalized.includes('nhl')) {
    return SPORT_INSIGHTS.hockey;
  }
  if (normalized.includes('mma') || normalized.includes('ufc')) {
    return SPORT_INSIGHTS.mma;
  }
  
  return SPORT_INSIGHTS.default;
}

// Extract style keywords from tactical analysis
function extractStyleHighlights(narrative: string, sport: string): string[] {
  const highlights: string[] = [];
  const lowerNarrative = narrative.toLowerCase();
  
  // Soccer-specific
  if (lowerNarrative.includes('possession')) highlights.push('Possession-based');
  if (lowerNarrative.includes('counter') || lowerNarrative.includes('transition')) highlights.push('Counter-attacking');
  if (lowerNarrative.includes('pressing') || lowerNarrative.includes('high press')) highlights.push('High-pressing');
  if (lowerNarrative.includes('defensive')) highlights.push('Defensive');
  if (lowerNarrative.includes('set piece') || lowerNarrative.includes('set-piece')) highlights.push('Set-piece threat');
  
  // Basketball-specific
  if (lowerNarrative.includes('fast') || lowerNarrative.includes('pace')) highlights.push('Fast-paced');
  if (lowerNarrative.includes('three') || lowerNarrative.includes('3-point')) highlights.push('3PT heavy');
  if (lowerNarrative.includes('paint') || lowerNarrative.includes('inside')) highlights.push('Inside game');
  
  // General
  if (lowerNarrative.includes('dominant')) highlights.push('Dominant side');
  if (lowerNarrative.includes('momentum')) highlights.push('Momentum shift');
  if (lowerNarrative.includes('upset')) highlights.push('Upset potential');
  
  return highlights.slice(0, 4);
}

export default function SportInsightsCard({ result }: SportInsightsCardProps) {
  const { matchInfo, tacticalAnalysis, momentumAndForm } = result;
  const config = getSportInsightsConfig(matchInfo.sport);
  
  // Extract style highlights from narrative
  const styleHighlights = extractStyleHighlights(
    tacticalAnalysis.matchNarrative || tacticalAnalysis.stylesSummary || '',
    matchInfo.sport
  );
  
  // Get momentum comparison
  const homeMomentum = momentumAndForm.homeMomentumScore ?? 5;
  const awayMomentum = momentumAndForm.awayMomentumScore ?? 5;
  const momentumAdvantage = homeMomentum > awayMomentum ? 'home' : 
                            awayMomentum > homeMomentum ? 'away' : 'even';

  return (
    <div className="bg-bg-card rounded-card border border-divider overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-divider bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm">{config.icon}</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary">{config.title}</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">Sport-specific analysis</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Style Summary */}
        {tacticalAnalysis.stylesSummary && (
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {tacticalAnalysis.stylesSummary}
            </p>
          </div>
        )}

        {/* Style Tags */}
        {styleHighlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {styleHighlights.map((highlight, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded-full"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        {/* Momentum Bars */}
        <div className="bg-bg-hover rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs text-text-muted">Momentum</span>
            <span className={`text-[10px] sm:text-xs font-medium ${
              momentumAdvantage === 'home' ? 'text-success' :
              momentumAdvantage === 'away' ? 'text-info' :
              'text-text-secondary'
            }`}>
              {momentumAdvantage === 'home' ? `${matchInfo.homeTeam} ↑` :
               momentumAdvantage === 'away' ? `${matchInfo.awayTeam} ↑` :
               'Even'}
            </span>
          </div>
          
          <div className="space-y-2">
            {/* Home Momentum */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] text-text-muted w-12 truncate">{matchInfo.homeTeam.split(' ').pop()}</span>
              <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${homeMomentum * 10}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-text-primary w-6 text-right">{homeMomentum}</span>
            </div>
            
            {/* Away Momentum */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] text-text-muted w-12 truncate">{matchInfo.awayTeam.split(' ').pop()}</span>
              <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-info rounded-full transition-all duration-500"
                  style={{ width: `${awayMomentum * 10}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-text-primary w-6 text-right">{awayMomentum}</span>
            </div>
          </div>
        </div>

        {/* Sport Key Facts */}
        <div className="border-t border-divider pt-4">
          <p className="text-[10px] sm:text-xs font-medium text-text-muted mb-2">💡 {matchInfo.sport} Key Facts</p>
          <ul className="space-y-1.5">
            {config.insights.slice(0, 3).map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-accent text-[10px] mt-0.5">•</span>
                <span className="text-[10px] sm:text-xs text-text-secondary leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
