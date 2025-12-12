/**
 * Analyzer Components Barrel Export
 * 
 * Exports all analyzer-related components for easy import.
 */

// Main results component (uses new layered layout)
export { default as AnalysisResults } from './AnalysisResults';

// Layer 1: Quick Glance
export { default as QuickGlanceCard } from './QuickGlanceCard';
export { default as QuickBriefingCard } from './QuickBriefingCard';

// Layer 1.5: Stats & Factors
export { default as QuickStatsCard } from './QuickStatsCard';
export { default as KeyFactorsCard } from './KeyFactorsCard';

// Layer 2: Confidence & Sport Insights
export { default as ConfidenceMeter } from './ConfidenceMeter';
export { default as SportInsightsCard } from './SportInsightsCard';

// Layer 3: Accordion
export { default as AnalysisAccordion } from './AnalysisAccordion';

// Layer 3: Extras
export { default as ExtrasSection } from './ExtrasSection';

// Supporting components (still available for potential use)
export { default as ListenToAnalysisButton } from './ListenToAnalysisButton';
export { default as UsageCounter } from './UsageCounter';
export { default as HeadToHeadSection } from './HeadToHeadSection';
export { default as TeamStatsSection } from './TeamStatsSection';

// Sharing & Copy Components
export { default as ShareCard } from './ShareCard';
export { default as CopyInsightsButton } from './CopyInsightsButton';

// NEW: Premium Visualization Components
export { default as ProbabilityDonut } from './ProbabilityDonut';
export { default as StatComparisonBar, MultiStatComparison } from './StatComparisonBar';
export { default as FormTimeline, FormBadgesCompact } from './FormTimeline';
export { default as MatchCountdown } from './MatchCountdown';
export { default as H2HStatsCard } from './H2HStatsCard';
export { default as QuickAnalyzeButton } from './QuickAnalyzeButton';
export { default as KeyMetricsGrid, AnalysisSummaryMetrics } from './KeyMetricsGrid';
export { default as DataFreshnessIndicator, DataConfidenceBadge } from './DataFreshnessIndicator';

// NEW: Neutral/Educational Components (replacing betting-adjacent)
export { default as OddsComparisonCard } from './OddsComparisonCard';

// Legacy components (kept for reference, not used in new layout)
export { default as MatchSummaryCard } from './MatchSummaryCard';
export { default as ProbabilitiesPanel } from './ProbabilitiesPanel';
export { default as RiskAnalysisCard } from './RiskAnalysisCard';
export { default as MomentumFormSection } from './MomentumFormSection';
export { default as MarketStabilitySection } from './MarketStabilitySection';
export { default as UpsetPotentialCard } from './UpsetPotentialCard';
export { default as TacticalAnalysisSection } from './TacticalAnalysisSection';
export { default as UserContextBox } from './UserContextBox';
export { default as ResponsibleGamblingSection } from './ResponsibleGamblingSection';
export { default as WarningsSection } from './WarningsSection';

// NEW: High-Level Analytics Components
export { default as LeagueContextCard } from './LeagueContextCard';
export { default as TeamComparisonRadar } from './TeamComparisonRadar';
export { default as MatchContextIndicators } from './MatchContextIndicators';
export { default as RestScheduleCard } from './RestScheduleCard';
export { default as InjuryImpactCard } from './InjuryImpactCard';

// NEW: Premium Tier System Components
export { default as SectionDivider } from './SectionDivider';
export { default as MatchStoryCard } from './MatchStoryCard';
export { default as CoreVerdictCard } from './CoreVerdictCard';

// NEW: Pre-Match Insights Components (Viral/Shareable Stats)
export { default as MatchHeadlinesCard, MatchHeadlinesInline } from './MatchHeadlinesCard';
export { default as GoalsTimingCard, GoalsTimingCompact } from './GoalsTimingCard';
export { default as KeyAbsencesBanner, AbsencesBadge, AbsencesSummary } from './KeyAbsencesBanner';
export { default as StreaksCard, StreaksInline, StreakHighlight } from './StreaksCard';
export { default as VenueSplitsCard, VenueSplitCompact, VenueStatBadge } from './VenueSplitsCard';
export { default as PreMatchInsightsPanel, PreMatchInsightsSummary } from './PreMatchInsightsPanel';
