/**
 * Accuracy Core - LLM Integration
 * 
 * This module provides the bridge between the accuracy pipeline
 * and the LLM (GPT-4o-mini). The LLM receives READ-ONLY data
 * and can only generate narrative/interpretation.
 * 
 * The LLM NEVER:
 * - Calculates probabilities
 * - Decides who has the edge
 * - Picks winners
 * 
 * The LLM ONLY:
 * - Explains WHY the signals favor a team
 * - Generates narrative around computed values
 * - Provides context and color
 */

import { PipelineOutput, PipelineResult, PipelineInput, runAccuracyPipeline } from './index';

// ============================================
// LLM INPUT FORMATTER
// ============================================

/**
 * Format pipeline output for LLM consumption
 * This is the ONLY data the LLM receives about probabilities/edge
 */
export function formatForLLM(
  result: PipelineResult,
  homeTeam: string,
  awayTeam: string
): string {
  const { output, details } = result;
  const { probabilities, edge, dataQuality, volatility, favored, confidence, suppressEdge } = output;
  
  const lines: string[] = [];
  
  // Header with computed verdict
  lines.push(`=== COMPUTED ANALYSIS (READ-ONLY) ===`);
  lines.push(`These values are FINAL. Do NOT recalculate or contradict them.`);
  lines.push('');
  
  // Clear favored team
  if (favored === 'home') {
    lines.push(`VERDICT: ${homeTeam} (HOME) is favored`);
  } else if (favored === 'away') {
    lines.push(`VERDICT: ${awayTeam} (AWAY) is favored`);
  } else if (favored === 'draw') {
    lines.push(`VERDICT: Draw is the most likely outcome`);
  } else {
    lines.push(`VERDICT: Match is evenly balanced`);
  }
  
  lines.push(`CONFIDENCE: ${confidence.toUpperCase()}`);
  lines.push('');
  
  // Probabilities (calibrated)
  lines.push(`MODEL PROBABILITIES:`);
  lines.push(`- ${homeTeam} (HOME): ${(probabilities.home * 100).toFixed(1)}%`);
  lines.push(`- ${awayTeam} (AWAY): ${(probabilities.away * 100).toFixed(1)}%`);
  if (probabilities.draw !== undefined) {
    lines.push(`- Draw: ${(probabilities.draw * 100).toFixed(1)}%`);
  }
  lines.push('');
  
  // Market comparison
  const marketHome = details.marketProbabilities.impliedProbabilitiesNoVig.home;
  const marketAway = details.marketProbabilities.impliedProbabilitiesNoVig.away;
  lines.push(`MARKET PROBABILITIES (vig removed):`);
  lines.push(`- ${homeTeam}: ${(marketHome * 100).toFixed(1)}%`);
  lines.push(`- ${awayTeam}: ${(marketAway * 100).toFixed(1)}%`);
  lines.push(`- Market margin: ${(details.marketProbabilities.marketMargin * 100).toFixed(1)}%`);
  lines.push('');
  
  // Edge (if not suppressed)
  if (!suppressEdge && edge.value > 0.02) {
    const edgeTeam = edge.outcome === 'home' ? homeTeam : edge.outcome === 'away' ? awayTeam : 'Draw';
    lines.push(`EDGE DETECTED:`);
    lines.push(`- ${edgeTeam}: +${(edge.value * 100).toFixed(1)}% edge`);
    lines.push(`- Quality: ${edge.quality}`);
  } else {
    lines.push(`EDGE: No significant edge detected`);
  }
  lines.push('');
  
  // Quality flags
  lines.push(`DATA QUALITY: ${dataQuality}`);
  lines.push(`VOLATILITY: ${volatility}`);
  
  // Expected scores (for soccer/hockey)
  if (details.expectedScores) {
    lines.push('');
    lines.push(`EXPECTED SCORES: ${homeTeam} ${details.expectedScores.home} - ${details.expectedScores.away} ${awayTeam}`);
  }
  
  return lines.join('\n');
}

// ============================================
// LLM PROMPT BUILDER
// ============================================

/**
 * Build the system prompt for LLM
 * Emphasizes that probabilities are computed, not to be recalculated
 */
export function buildLLMSystemPrompt(): string {
  return `You are SportBot, a sharp sports analyst who explains match dynamics.

CRITICAL RULES:
1. You are an INTERPRETER, not a PREDICTOR
2. All probabilities and edges have been computed by our statistical models
3. You MUST use the COMPUTED values provided - never contradict them
4. Your job is to explain WHY the signals favor a team, not to pick winners
5. Never say "I predict" or "I think X will win" - explain the computed analysis

YOUR ROLE:
- Translate numbers into narrative
- Explain what the computed probabilities mean
- Discuss the factors behind the edge (form, H2H, etc.)
- Highlight risks and uncertainties
- Be sharp and confident about the ANALYSIS, not about OUTCOMES

FORMAT:
- 4 snapshot bullets (THE EDGE, MARKET MISS, THE PATTERN, THE RISK)
- 1 gameFlow paragraph
- 2 risk factors

WHEN EDGE IS SUPPRESSED:
- Don't manufacture an edge
- Explain why the match is unpredictable
- Focus on what makes it interesting

NEVER:
- Recalculate or contradict the computed probabilities
- Say "${'"'}I predict${'"'}" or give tips
- Claim 100% confidence
- Confuse HOME and AWAY teams
- Say the away team has "home advantage"`;
}

/**
 * Build the user prompt for LLM
 */
export function buildLLMUserPrompt(
  homeTeam: string,
  awayTeam: string,
  league: string,
  pipelineData: string,
  additionalContext: string
): string {
  return `${homeTeam} (HOME) vs ${awayTeam} (AWAY) | ${league}

${pipelineData}

ADDITIONAL CONTEXT:
${additionalContext}

Generate analysis that EXPLAINS the computed verdict above.
Your snapshot bullets must align with the VERDICT and EDGE shown above.

JSON output:
{
  "snapshot": [
    "THE EDGE: [explain why ${'"'}VERDICT${'"'} team is favored based on the data]",
    "MARKET MISS: [if edge exists, explain what market might be missing]",
    "THE PATTERN: [H2H or form pattern supporting the verdict]",
    "THE RISK: [what could upset this analysis]"
  ],
  "gameFlow": "Narrative explanation of how the match might unfold based on the data.",
  "riskFactors": ["Primary risk factor", "Secondary risk factor"]
}

Remember: ${homeTeam} is at HOME. ${awayTeam} is AWAY.`;
}

// ============================================
// COMPLETE LLM INTEGRATION
// ============================================

export interface LLMAnalysisResult {
  snapshot: string[];
  gameFlow: string;
  riskFactors: string[];
  // Computed values (from pipeline, not LLM)
  computed: {
    favored: 'home' | 'away' | 'draw' | 'even';
    confidence: 'high' | 'medium' | 'low';
    probabilities: {
      home: number;
      away: number;
      draw?: number;
    };
    edge: {
      value: number;
      quality: string;
      outcome: string;
    };
    dataQuality: string;
  };
}

/**
 * Run pipeline and generate LLM analysis
 * This is the main integration point
 */
export async function generateAnalysisWithPipeline(
  input: PipelineInput,
  additionalContext: string,
  openai: { chat: { completions: { create: (params: { model: string; messages: { role: string; content: string }[]; response_format: { type: string }; max_tokens: number; temperature: number }) => Promise<{ choices: { message: { content: string | null } }[] }> } } }
): Promise<LLMAnalysisResult> {
  // Run the accuracy pipeline first
  const pipelineResult = await runAccuracyPipeline(input);
  
  // Format for LLM
  const pipelineData = formatForLLM(pipelineResult, input.homeTeam, input.awayTeam);
  
  // Build prompts
  const systemPrompt = buildLLMSystemPrompt();
  const userPrompt = buildLLMUserPrompt(
    input.homeTeam,
    input.awayTeam,
    input.league,
    pipelineData,
    additionalContext
  );
  
  // Call LLM
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
  if (!content) {
    throw new Error('No content from LLM');
  }
  
  const llmOutput = JSON.parse(content);
  
  // Combine LLM narrative with computed values
  return {
    snapshot: llmOutput.snapshot || [],
    gameFlow: llmOutput.gameFlow || '',
    riskFactors: llmOutput.riskFactors || [],
    computed: {
      favored: pipelineResult.output.favored,
      confidence: pipelineResult.output.confidence,
      probabilities: {
        home: pipelineResult.output.probabilities.home,
        away: pipelineResult.output.probabilities.away,
        draw: pipelineResult.output.probabilities.draw,
      },
      edge: {
        value: pipelineResult.output.edge.value,
        quality: pipelineResult.output.edge.quality,
        outcome: pipelineResult.output.edge.outcome,
      },
      dataQuality: pipelineResult.output.dataQuality,
    },
  };
}

// ============================================
// FALLBACK ANALYSIS (When LLM fails)
// ============================================

/**
 * Generate fallback analysis from pipeline data alone
 * Used when LLM call fails
 */
export function generateFallbackAnalysis(
  result: PipelineResult,
  homeTeam: string,
  awayTeam: string
): LLMAnalysisResult {
  const { output, details } = result;
  
  // Build snapshot from computed values
  const snapshot: string[] = [];
  
  // THE EDGE
  if (output.edge.value > 0.02 && !output.suppressEdge) {
    const edgeTeam = output.edge.outcome === 'home' ? homeTeam : 
                     output.edge.outcome === 'away' ? awayTeam : 'Draw';
    snapshot.push(`THE EDGE: ${edgeTeam} shows a ${(output.edge.value * 100).toFixed(1)}% edge based on form and efficiency metrics.`);
  } else {
    snapshot.push(`THE EDGE: No clear edge detected. This match is balanced.`);
  }
  
  // MARKET MISS
  if (output.edge.value > 0.03) {
    const marketHome = (details.marketProbabilities.impliedProbabilitiesNoVig.home * 100).toFixed(0);
    const modelHome = (output.probabilities.home * 100).toFixed(0);
    snapshot.push(`MARKET MISS: Market implies ${marketHome}% for ${homeTeam}, model calculates ${modelHome}%.`);
  } else {
    snapshot.push(`MARKET MISS: Odds appear fairly priced. No significant market inefficiency.`);
  }
  
  // THE PATTERN
  snapshot.push(`THE PATTERN: Data quality is ${output.dataQuality}. ${output.volatility} volatility in recent form.`);
  
  // THE RISK
  if (output.dataQuality === 'LOW' || output.volatility === 'HIGH') {
    snapshot.push(`THE RISK: Limited data and high volatility make this unpredictable.`);
  } else {
    snapshot.push(`THE RISK: Form can change quickly. Past performance doesn't guarantee future results.`);
  }
  
  // Game flow
  const expectedHome = details.expectedScores?.home || 1.2;
  const expectedAway = details.expectedScores?.away || 1.0;
  const gameFlow = `Expected scoring suggests ${homeTeam} ${expectedHome.toFixed(1)} - ${expectedAway.toFixed(1)} ${awayTeam}. ` +
    `Model confidence is ${output.confidence} based on ${output.dataQuality} data quality.`;
  
  return {
    snapshot,
    gameFlow,
    riskFactors: [
      output.suppressReasons[0] || 'Form can change rapidly',
      'Historical patterns may not repeat',
    ],
    computed: {
      favored: output.favored,
      confidence: output.confidence,
      probabilities: {
        home: output.probabilities.home,
        away: output.probabilities.away,
        draw: output.probabilities.draw,
      },
      edge: {
        value: output.edge.value,
        quality: output.edge.quality,
        outcome: output.edge.outcome,
      },
      dataQuality: output.dataQuality,
    },
  };
}
