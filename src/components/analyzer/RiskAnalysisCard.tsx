/**
 * Risk Analysis Card Component
 * 
 * Displays analysis.riskAnalysis with overall risk level,
 * risk explanation, bankroll impact, and psychology bias.
 */

'use client';

import { RiskAnalysis, RiskLevel } from '@/types';

interface RiskAnalysisCardProps {
  riskAnalysis: RiskAnalysis;
}

const riskLevelConfig: Record<RiskLevel, { 
  label: string; 
  bgColor: string; 
  textColor: string; 
  borderColor: string;
  iconBg: string;
  icon: string;
}> = {
  LOW: { 
    label: 'Low Risk', 
    bgColor: 'bg-accent-green/5', 
    textColor: 'text-accent-green',
    borderColor: 'border-accent-green/30',
    iconBg: 'bg-accent-green/10',
    icon: '✓'
  },
  MEDIUM: { 
    label: 'Medium Risk', 
    bgColor: 'bg-accent-gold/5', 
    textColor: 'text-accent-gold',
    borderColor: 'border-accent-gold/30',
    iconBg: 'bg-accent-gold/10',
    icon: '⚠'
  },
  HIGH: { 
    label: 'High Risk', 
    bgColor: 'bg-accent-red/5', 
    textColor: 'text-accent-red',
    borderColor: 'border-accent-red/30',
    iconBg: 'bg-accent-red/10',
    icon: '⚡'
  },
};

export default function RiskAnalysisCard({ riskAnalysis }: RiskAnalysisCardProps) {
  const config = riskLevelConfig[riskAnalysis.overallRiskLevel];

  return (
    <div className={`rounded-xl border-2 p-6 ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start gap-4">
        {/* Risk Level Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <span className="text-2xl">{config.icon}</span>
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              Risk Assessment
            </h3>
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${config.textColor} ${config.iconBg}`}>
              {config.label}
            </span>
          </div>

          {/* Risk Explanation */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Risk Explanation</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              {riskAnalysis.riskExplanation}
            </p>
          </div>

          {/* Bankroll Impact */}
          <div className="mb-4 p-3 bg-white/70 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <span>💼</span>
              Bankroll Impact
            </h4>
            <p className="text-gray-600 text-sm">
              {riskAnalysis.bankrollImpact}
            </p>
          </div>

          {/* Psychology Bias */}
          <div className="p-3 bg-accent-cyan/5 rounded-lg border border-accent-cyan/20">
            <h4 className="text-sm font-semibold text-accent-cyan mb-1 flex items-center gap-2">
              <span>🧠</span>
              Psychology Alert: {riskAnalysis.psychologyBias.name}
            </h4>
            <p className="text-gray-600 text-sm">
              {riskAnalysis.psychologyBias.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
