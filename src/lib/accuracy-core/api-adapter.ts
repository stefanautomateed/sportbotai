/**
 * Accuracy Core - API Adapter
 * 
 * Provides backward-compatible integration with existing API routes.
 * Converts new pipeline output to match existing response formats.
 */

import { 
  PipelineInput, 
  runAccuracyPipeline, 
  PipelineResult,
} from './index';
import { 
  formatForLLM, 
  buildLLMSystemPrompt, 
  buildLLMUserPrompt,
  generateFallbackAnalysis,
} from './llm-integration';

// ============================================
// EXISTING API FORMAT TYPES
// ============================================

interface LegacyStory {
  favored: 'home' | 'away' | 'draw';
  confidence: 'strong' | 'moderate' | 'slight';
  narrative: string;
  snapshot: string[];
  riskFactors: string[];
}

interface LegacyHeadline {
  icon: string;
  text: string;
  favors: string;
  viral: boolean;
}

interface LegacySignals {
  formLabel: string;
  strengthEdgeLabel: string;
  strengthEdgeDirection: 'home' | 'away' | 'even';
  tempoLabel: string;
  efficiencyLabel: string;
  availabilityLabel: string;
}

interface LegacyMarketIntel {
  hasValue: boolean;
  valueOutcome: 'home' | 'away' | 'draw' | null;
  valuePercentage: number;
  marketVerdict: string;
  marketMargin: number;
  signalQuality: number;
  probabilities: {
    home: number;
    away: number;
    draw?: number;
  };
  impliedProbabilities: {
    home: number;
    away: number;
    draw?: number;
  };
  valueGaps: {
    home: number;
    away: number;
    draw?: number;
  };
}

export interface LegacyAnalysisResponse {
  story: LegacyStory;
  headlines: LegacyHeadline[];
  universalSignals: {
    form: string;
    strength_edge: string;
    tempo: string;
    efficiency_edge: string;
    availability_impact: string;
    confidence: 'high' | 'medium' | 'low';
    clarity_score: number;
    display: {
      edge: {
        direction: 'home' | 'away' | 'even';
        percentage: number;
        label: string;
      };
    };
  };
  signals: LegacySignals;
  marketIntel?: LegacyMarketIntel;
}

// ============================================
// PIPELINE TO LEGACY CONVERTER
// ============================================

/**
 * Convert pipeline result to legacy API format
 */
export function pipelineToLegacyFormat(
  result: PipelineResult,
  llmSnapshot: string[],
  llmGameFlow: string,
  llmRiskFactors: string[],
  homeTeam: string,
  awayTeam: string
): LegacyAnalysisResponse {
  const { output, details } = result;
  
  // Map favored to legacy format
  const legacyFavored: 'home' | 'away' | 'draw' = 
    output.favored === 'even' ? 'draw' : output.favored as 'home' | 'away' | 'draw';
  
  // Map confidence
  const legacyConfidence: 'strong' | 'moderate' | 'slight' = 
    output.confidence === 'high' ? 'strong' :
    output.confidence === 'low' ? 'slight' : 'moderate';
  
  // Build story
  const story: LegacyStory = {
    favored: legacyFavored,
    confidence: legacyConfidence,
    narrative: llmGameFlow || `${homeTeam} hosts ${awayTeam} in this fixture.`,
    snapshot: llmSnapshot,
    riskFactors: llmRiskFactors,
  };
  
  // Build headlines
  const edgeTeam = output.edge.outcome === 'home' ? homeTeam :
                   output.edge.outcome === 'away' ? awayTeam : null;
  
  const headlineText = edgeTeam && output.edge.value > 0.03
    ? `${edgeTeam} shows +${(output.edge.value * 100).toFixed(1)}% edge`
    : `${homeTeam} vs ${awayTeam}: Evenly matched`;
  
  const headlines: LegacyHeadline[] = [
    { 
      icon: '📊', 
      text: headlineText, 
      favors: output.favored === 'even' ? 'neutral' : output.favored, 
      viral: output.edge.quality === 'HIGH'
    }
  ];
  
  // Build universal signals (legacy format)
  const edgeDirection: 'home' | 'away' | 'even' = 
    output.edge.outcome === 'none' ? 'even' : output.edge.outcome as 'home' | 'away' | 'even';
  
  const edgePercentage = Math.round(
    (output.edge.outcome === 'home' ? output.probabilities.home : 
     output.edge.outcome === 'away' ? output.probabilities.away : 0.5) * 100
  );
  
  const universalSignals = {
    form: output.dataQuality === 'HIGH' ? 'Strong form data' : 
          output.dataQuality === 'LOW' ? 'Limited form data' : 'Moderate form data',
    strength_edge: output.edge.value > 0.03 
      ? `${edgeDirection === 'home' ? 'Home' : edgeDirection === 'away' ? 'Away' : 'Even'} +${Math.round(output.edge.value * 100)}%`
      : 'Even',
    tempo: output.volatility === 'LOW' ? 'Controlled' : 
           output.volatility === 'HIGH' ? 'High' : 'Medium',
    efficiency_edge: output.edge.outcome === 'home' ? 'Home offense' :
                     output.edge.outcome === 'away' ? 'Away offense' : 'Balanced',
    availability_impact: 'Low Impact', // Would need injury data
    confidence: output.confidence,
    clarity_score: output.dataQuality === 'HIGH' ? 85 :
                   output.dataQuality === 'MEDIUM' ? 65 :
                   output.dataQuality === 'LOW' ? 45 : 25,
    display: {
      edge: {
        direction: edgeDirection,
        percentage: edgePercentage,
        label: output.edge.value > 0.03 
          ? `${edgeDirection === 'home' ? homeTeam : awayTeam} +${Math.round(output.edge.value * 100)}%`
          : 'Even match',
      },
    },
  };
  
  // Build signals (legacy format)
  const signals: LegacySignals = {
    formLabel: universalSignals.form,
    strengthEdgeLabel: universalSignals.strength_edge,
    strengthEdgeDirection: edgeDirection,
    tempoLabel: universalSignals.tempo,
    efficiencyLabel: universalSignals.efficiency_edge,
    availabilityLabel: universalSignals.availability_impact,
  };
  
  // Build market intel
  const marketIntel: LegacyMarketIntel = {
    hasValue: output.edge.value > 0.03 && !output.suppressEdge,
    valueOutcome: output.edge.outcome === 'none' ? null : output.edge.outcome as 'home' | 'away' | 'draw',
    valuePercentage: output.edge.value * 100,
    marketVerdict: output.edge.value > 0.05 ? `${edgeTeam || 'N/A'} +${(output.edge.value * 100).toFixed(1)}% Value` :
                   output.edge.value > 0.03 ? 'Slight Value' : 'Fair Price',
    marketMargin: details.marketProbabilities.marketMargin * 100,
    signalQuality: universalSignals.clarity_score,
    probabilities: {
      home: Math.round(output.probabilities.home * 1000) / 10,
      away: Math.round(output.probabilities.away * 1000) / 10,
      draw: output.probabilities.draw ? Math.round(output.probabilities.draw * 1000) / 10 : undefined,
    },
    impliedProbabilities: {
      home: Math.round(details.marketProbabilities.impliedProbabilitiesNoVig.home * 1000) / 10,
      away: Math.round(details.marketProbabilities.impliedProbabilitiesNoVig.away * 1000) / 10,
      draw: details.marketProbabilities.impliedProbabilitiesNoVig.draw 
        ? Math.round(details.marketProbabilities.impliedProbabilitiesNoVig.draw * 1000) / 10 
        : undefined,
    },
    valueGaps: {
      home: Math.round(details.edge.home * 1000) / 10,
      away: Math.round(details.edge.away * 1000) / 10,
      draw: details.edge.draw ? Math.round(details.edge.draw * 1000) / 10 : undefined,
    },
  };
  
  return {
    story,
    headlines,
    universalSignals,
    signals,
    marketIntel,
  };
}

// ============================================
// MAIN INTEGRATION FUNCTION
// ============================================

interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: { role: string; content: string }[];
        response_format: { type: string };
        max_tokens: number;
        temperature: number;
      }) => Promise<{
        choices: { message: { content: string | null } }[];
      }>;
    };
  };
}

/**
 * Run the complete accuracy pipeline with LLM interpretation
 * Returns legacy-compatible format for existing API routes
 */
export async function runAccuracyAnalysis(
  input: PipelineInput,
  additionalContext: string,
  openai: OpenAIClient
): Promise<LegacyAnalysisResponse> {
  // Step 1: Run accuracy pipeline
  const pipelineResult = await runAccuracyPipeline(input);
  
  // Step 2: Format for LLM
  const pipelineData = formatForLLM(pipelineResult, input.homeTeam, input.awayTeam);
  
  // Step 3: Build prompts
  const systemPrompt = buildLLMSystemPrompt();
  const userPrompt = buildLLMUserPrompt(
    input.homeTeam,
    input.awayTeam,
    input.league,
    pipelineData,
    additionalContext
  );
  
  let snapshot: string[] = [];
  let gameFlow = '';
  let riskFactors: string[] = [];
  
  try {
    // Step 4: Call LLM for narrative
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.3,
    });
    
    const content = completion.choices[0].message.content;
    if (content) {
      const llmOutput = JSON.parse(content);
      snapshot = llmOutput.snapshot || [];
      gameFlow = llmOutput.gameFlow || '';
      riskFactors = llmOutput.riskFactors || [];
    }
  } catch (error) {
    console.error('LLM call failed, using fallback:', error);
    
    // Use fallback analysis
    const fallback = generateFallbackAnalysis(pipelineResult, input.homeTeam, input.awayTeam);
    snapshot = fallback.snapshot;
    gameFlow = fallback.gameFlow;
    riskFactors = fallback.riskFactors;
  }
  
  // Step 5: Convert to legacy format
  return pipelineToLegacyFormat(
    pipelineResult,
    snapshot,
    gameFlow,
    riskFactors,
    input.homeTeam,
    input.awayTeam
  );
}

// ============================================
// QUICK MIGRATION HELPER
// ============================================

/**
 * Convert existing data format to pipeline input
 * Use this to migrate existing API routes gradually
 */
export function convertToPipelineInput(params: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: Date | string;
  homeStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  };
  awayStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  };
  homeForm: string;
  awayForm: string;
  h2h?: {
    totalMeetings: number;
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  odds: {
    home: number;
    away: number;
    draw?: number;
    bookmaker?: string;
  };
}): PipelineInput {
  return {
    matchId: params.matchId,
    sport: params.sport,
    league: params.league,
    homeTeam: params.homeTeam,
    awayTeam: params.awayTeam,
    kickoff: typeof params.kickoff === 'string' ? new Date(params.kickoff) : params.kickoff,
    homeStats: {
      played: params.homeStats.played,
      wins: params.homeStats.wins,
      draws: params.homeStats.draws,
      losses: params.homeStats.losses,
      scored: params.homeStats.goalsScored,
      conceded: params.homeStats.goalsConceded,
    },
    awayStats: {
      played: params.awayStats.played,
      wins: params.awayStats.wins,
      draws: params.awayStats.draws,
      losses: params.awayStats.losses,
      scored: params.awayStats.goalsScored,
      conceded: params.awayStats.goalsConceded,
    },
    homeForm: params.homeForm,
    awayForm: params.awayForm,
    h2h: params.h2h ? {
      total: params.h2h.totalMeetings,
      homeWins: params.h2h.homeWins,
      awayWins: params.h2h.awayWins,
      draws: params.h2h.draws,
    } : undefined,
    odds: [{
      bookmaker: params.odds.bookmaker || 'default',
      homeOdds: params.odds.home,
      awayOdds: params.odds.away,
      drawOdds: params.odds.draw,
    }],
  };
}
