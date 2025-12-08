/**
 * Market Stability Section Component
 * 
 * Displays analysis.marketStability with sub-cards for each market type,
 * confidence stars, and safest market recommendation.
 */

'use client';

import { MarketStability, MarketStabilityItem, RiskLevel, MarketType, MarketConfidence } from '@/types';

interface MarketStabilitySectionProps {
  marketStability: MarketStability;
}

const stabilityConfig: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  LOW: { label: 'Low', color: 'text-accent-red', bgColor: 'bg-accent-red/5', borderColor: 'border-accent-red/20' },
  MEDIUM: { label: 'Medium', color: 'text-accent-gold', bgColor: 'bg-accent-gold/5', borderColor: 'border-accent-gold/20' },
  HIGH: { label: 'High', color: 'text-accent-green', bgColor: 'bg-accent-green/5', borderColor: 'border-accent-green/20' },
};

const marketTypeLabels: Record<string, { name: string; icon: string }> = {
  main_1x2: { name: '1X2 (Match Result)', icon: '⚽' },
  over_under: { name: 'Over/Under', icon: '🎯' },
  btts: { name: 'Both Teams To Score', icon: '🥅' },
};

const safestMarketLabels: Record<MarketType, string> = {
  '1X2': 'Match Result (1X2)',
  'OVER_UNDER': 'Over/Under Goals',
  'BTTS': 'Both Teams To Score',
  'NONE': 'No Clear Safest Market',
};

interface ConfidenceStarsProps {
  confidence: MarketConfidence;
}

function ConfidenceStars({ confidence }: ConfidenceStarsProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= confidence ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

interface MarketCardProps {
  marketKey: string;
  market: MarketStabilityItem;
}

function MarketCard({ marketKey, market }: MarketCardProps) {
  const config = stabilityConfig[market.stability];
  const marketInfo = marketTypeLabels[marketKey] || { name: marketKey, icon: '📊' };

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{marketInfo.icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{marketInfo.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.color} bg-white/70`}>
          {config.label}
        </span>
      </div>
      
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-1">Confidence</p>
        <ConfidenceStars confidence={market.confidence} />
      </div>
      
      <p className="text-xs text-gray-600 leading-relaxed">{market.comment}</p>
    </div>
  );
}

export default function MarketStabilitySection({ marketStability }: MarketStabilitySectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-xl">🛡️</span>
        Market Stability
      </h3>

      {/* Market Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <MarketCard marketKey="main_1x2" market={marketStability.markets.main_1x2} />
        <MarketCard marketKey="over_under" market={marketStability.markets.over_under} />
        <MarketCard marketKey="btts" market={marketStability.markets.btts} />
      </div>

      {/* Safest Market Recommendation */}
      <div className="border-t border-gray-100 pt-4">
        <div className={`p-4 rounded-lg ${
          marketStability.safestMarketType !== 'NONE' 
            ? 'bg-accent-green/5 border border-accent-green/20' 
            : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              marketStability.safestMarketType !== 'NONE' 
                ? 'bg-accent-green/10' 
                : 'bg-gray-200'
            }`}>
              <span className="text-xl">
                {marketStability.safestMarketType !== 'NONE' ? '✅' : '❓'}
              </span>
            </div>
            <div>
              <h4 className={`font-semibold ${
                marketStability.safestMarketType !== 'NONE' 
                  ? 'text-accent-green' 
                  : 'text-gray-600'
              }`}>
                Safest Market: {safestMarketLabels[marketStability.safestMarketType]}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {marketStability.safestMarketExplanation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
