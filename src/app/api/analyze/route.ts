/**
 * API Route: /api/analyze
 * 
 * AI-powered sports match analysis endpoint using OpenAI GPT-4.
 * Returns comprehensive analysis following the BetSense AI JSON schema.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  AnalyzeRequestV2,
  AnalyzeResponseV2,
  RiskLevel,
  ValueFlag,
  Trend,
  DataQuality,
  BestValueSide,
  MarketType,
} from '@/types';

// ============================================
// OPENAI CLIENT (LAZY INIT)
// ============================================

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are an expert sports analyst AI for BetSense AI, an educational sports analytics platform. Your role is to analyze football matches and provide structured, data-driven insights strictly for informational and educational purposes.

=== ABSOLUTE RULES ===
1. NEVER give betting tips or tell the user what to bet.
2. NEVER imply certainty, guaranteed outcomes, or "safe bets".
3. NEVER recommend specific wagers or stake amounts.
4. ALWAYS include responsible gambling messaging.
5. ALWAYS return ONLY a single valid JSON object - no markdown, no commentary, no prose before or after.
6. ALWAYS stay realistic and avoid overconfidence in probability estimates.

=== YOUR ANALYTICAL TASKS ===
1. PROBABILITY ESTIMATION: Estimate realistic win/draw/loss probabilities based on available data. Account for uncertainty by avoiding extreme values (rarely below 10% or above 75% unless clearly justified).

2. VALUE ANALYSIS: Compare your estimated probabilities against implied probabilities from bookmaker odds. Flag value levels cautiously - HIGH value should be rare and well-justified.

3. RISK ASSESSMENT: Evaluate overall risk considering match volatility, data quality, and unpredictability factors. Be conservative - most matches should be MEDIUM or HIGH risk.

4. PSYCHOLOGICAL BIAS DETECTION: Identify cognitive biases that might affect perception of this match (recency bias, favorite-longshot bias, home team bias, etc.).

5. MOMENTUM & FORM: Score team momentum (1-10) and identify trends based on recent performance. Use UNKNOWN when data is insufficient.

6. MARKET STABILITY: Assess how predictable each market type is for this specific match. Lower confidence when data is limited.

7. UPSET POTENTIAL: Calculate realistic upset probability. Upsets in football are common (20-35% typically for favorites).

8. TACTICAL ANALYSIS: Describe playing styles, key matchup factors, and generate a neutral expert-style conclusion.

9. USER CONTEXT: If the user provided a pick, comment on it neutrally without endorsing or discouraging. Never say "good pick" or "bad pick".

=== DATA QUALITY RULES ===
- HIGH: Live API data with recent form, head-to-head, multiple bookmaker odds
- MEDIUM: API data but limited stats, or manual entry with reasonable detail
- LOW: Manual entry with minimal data, or critical information missing

=== PROBABILITY GUIDELINES ===
- Probabilities must sum to approximately 100% for homeWin + draw + awayWin
- Avoid extreme confidence: rarely go below 15% or above 70%
- Heavy favorites: 55-70% max
- Clear underdogs: 15-25% typical
- Over/under probabilities should reflect realistic goal expectations

=== OUTPUT FORMAT ===
Return ONLY this JSON structure with every field populated:

{
  "success": true,
  "confidenceScore": <number 1-100>,
  "matchInfo": {
    "matchId": <string | null>,
    "sport": <string>,
    "leagueName": <string>,
    "matchDate": <string ISO 8601>,
    "homeTeam": <string>,
    "awayTeam": <string>,
    "sourceType": "MANUAL" | "API",
    "dataQuality": "LOW" | "MEDIUM" | "HIGH"
  },
  "probabilities": {
    "homeWin": <number 0-100 | null>,
    "draw": <number 0-100 | null>,
    "awayWin": <number 0-100 | null>,
    "overUnderLine": <number | null>,
    "over": <number 0-100 | null>,
    "under": <number 0-100 | null>
  },
  "valueAnalysis": {
    "impliedProbabilities": {
      "homeWin": <number 0-100 | null>,
      "draw": <number 0-100 | null>,
      "awayWin": <number 0-100 | null>
    },
    "valueFlags": {
      "homeWin": "NONE" | "LOW" | "MEDIUM" | "HIGH",
      "draw": "NONE" | "LOW" | "MEDIUM" | "HIGH",
      "awayWin": "NONE" | "LOW" | "MEDIUM" | "HIGH"
    },
    "bestValueSide": "HOME" | "DRAW" | "AWAY" | "NONE",
    "valueCommentShort": <string>,
    "valueCommentDetailed": <string>
  },
  "riskAnalysis": {
    "overallRiskLevel": "LOW" | "MEDIUM" | "HIGH",
    "riskExplanation": <string>,
    "bankrollImpact": <string>,
    "psychologicalBias": {
      "name": <string>,
      "description": <string>
    }
  },
  "momentumAndForm": {
    "homeMomentumScore": <number 1-10 | null>,
    "awayMomentumScore": <number 1-10 | null>,
    "homeTrend": "RISING" | "FALLING" | "STABLE" | "UNKNOWN",
    "awayTrend": "RISING" | "FALLING" | "STABLE" | "UNKNOWN",
    "keyFormFactors": [<string>, ...]
  },
  "marketStability": {
    "markets": {
      "main_1x2": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": <string>
      },
      "over_under": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": <string>
      },
      "btts": {
        "stability": "LOW" | "MEDIUM" | "HIGH",
        "confidence": <1-5>,
        "comment": <string>
      }
    },
    "safestMarketType": "1X2" | "OVER_UNDER" | "BTTS" | "NONE",
    "safestMarketExplanation": <string>
  },
  "upsetPotential": {
    "upsetProbability": <number 0-100>,
    "upsetComment": <string>
  },
  "tacticalAnalysis": {
    "stylesSummary": <string>,
    "matchNarrative": <string>,
    "keyMatchFactors": [<string>, ...],
    "expertConclusionOneLiner": <string>
  },
  "userContext": {
    "userPick": <string | null>,
    "userStake": <number | null>,
    "pickComment": <string>
  },
  "responsibleGambling": {
    "coreNote": <string>,
    "tailoredNote": <string>
  },
  "meta": {
    "modelVersion": "1.0.0",
    "analysisGeneratedAt": <string ISO 8601>,
    "dataSourcesUsed": [<string>, ...],
    "warnings": [<string>, ...]
  }
}`;

// ============================================
// USER PROMPT BUILDER
// ============================================

function buildUserPrompt(
  matchData: AnalyzeRequestV2['matchData'],
  userPick?: string,
  userStake?: number
): string {
  const matchDataJson = JSON.stringify(matchData, null, 2);
  
  return `Analyze the following football match and return a complete JSON analysis.

=== MATCH DATA ===
${matchDataJson}

=== USER CONTEXT ===
User's Pick: ${userPick || 'None provided'}
User's Stake: ${userStake !== undefined ? `€${userStake}` : 'Not specified'}

=== INSTRUCTIONS ===
1. Analyze all available data and fill every field in the JSON schema.
2. If critical data is missing (no team names), set "success": false and populate the "error" field.
3. If data is limited but usable, set "dataQuality": "LOW", add warnings to meta.warnings, and still produce a complete analysis.
4. Calculate implied probabilities from odds using: impliedProb = (1 / decimalOdds) * 100
5. Be realistic with probabilities - football is unpredictable. Avoid extremes.
6. For the user's pick, provide neutral commentary without endorsing or discouraging it.
7. Always include a responsible gambling note tailored to the stake amount and risk level.
8. Use "modelVersion": "1.0.0" and set "analysisGeneratedAt" to the current ISO timestamp.

Return ONLY the JSON object. No other text.`;
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both legacy and new request formats
    const normalizedRequest = normalizeRequest(body);
    
    // Validate minimum required fields
    const validation = validateRequest(normalizedRequest);
    if (!validation.valid) {
      return NextResponse.json(
        createErrorResponse(validation.error!),
        { status: 400 }
      );
    }

    // Check for OpenAI API key
    const openai = getOpenAIClient();
    if (!openai) {
      console.warn('OPENAI_API_KEY not configured, using fallback analysis');
      return NextResponse.json(generateFallbackAnalysis(normalizedRequest));
    }

    // Call OpenAI API
    const analysis = await callOpenAI(openai, normalizedRequest);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error in /api/analyze:', error);
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
      return NextResponse.json(
        createErrorResponse(`AI service error: ${error.message}`),
        { status: 502 }
      );
    }

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    );
  }
}

// ============================================
// REQUEST NORMALIZATION
// ============================================

function normalizeRequest(body: any): AnalyzeRequestV2 {
  // Check if it's the new format
  if (body.matchData) {
    return body as AnalyzeRequestV2;
  }

  // Convert legacy format to new format
  return {
    matchData: {
      sport: body.sport || 'Soccer',
      league: body.league || 'Unknown League',
      homeTeam: body.teamA || body.homeTeam || '',
      awayTeam: body.teamB || body.awayTeam || '',
      sourceType: 'MANUAL',
      odds: {
        home: body.odds?.home || 0,
        draw: body.odds?.draw || null,
        away: body.odds?.away || 0,
      },
    },
    userPick: body.userPrediction || body.userPick,
    userStake: body.stake || body.userStake,
  };
}

// ============================================
// VALIDATION
// ============================================

function validateRequest(req: AnalyzeRequestV2): { valid: boolean; error?: string } {
  if (!req.matchData) {
    return { valid: false, error: 'matchData is required' };
  }
  if (!req.matchData.homeTeam || !req.matchData.awayTeam) {
    return { valid: false, error: 'homeTeam and awayTeam are required' };
  }
  if (!req.matchData.odds || req.matchData.odds.home <= 0 || req.matchData.odds.away <= 0) {
    return { valid: false, error: 'Valid odds (home and away) are required' };
  }
  return { valid: true };
}

// ============================================
// OPENAI API CALL
// ============================================

async function callOpenAI(
  openai: OpenAI,
  request: AnalyzeRequestV2
): Promise<AnalyzeResponseV2> {
  const userPrompt = buildUserPrompt(
    request.matchData,
    request.userPick,
    request.userStake
  );

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '';
  
  try {
    const parsed = JSON.parse(content);
    return validateAndSanitizeResponse(parsed, request);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    return generateFallbackAnalysis(request);
  }
}

// ============================================
// RESPONSE VALIDATION & SANITIZATION
// ============================================

function validateAndSanitizeResponse(
  raw: any,
  request: AnalyzeRequestV2
): AnalyzeResponseV2 {
  const now = new Date().toISOString();
  
  // Ensure all required fields exist with proper defaults
  return {
    success: raw.success ?? true,
    confidenceScore: clamp(raw.confidenceScore ?? 50, 1, 100),
    
    matchInfo: {
      matchId: raw.matchInfo?.matchId ?? request.matchData.matchId ?? null,
      sport: raw.matchInfo?.sport ?? request.matchData.sport ?? 'Soccer',
      leagueName: raw.matchInfo?.leagueName ?? request.matchData.league ?? 'Unknown',
      matchDate: raw.matchInfo?.matchDate ?? request.matchData.matchDate ?? now,
      homeTeam: raw.matchInfo?.homeTeam ?? request.matchData.homeTeam,
      awayTeam: raw.matchInfo?.awayTeam ?? request.matchData.awayTeam,
      sourceType: validateSourceType(raw.matchInfo?.sourceType ?? request.matchData.sourceType),
      dataQuality: validateDataQuality(raw.matchInfo?.dataQuality),
    },
    
    probabilities: {
      homeWin: clampNullable(raw.probabilities?.homeWin, 0, 100),
      draw: clampNullable(raw.probabilities?.draw, 0, 100),
      awayWin: clampNullable(raw.probabilities?.awayWin, 0, 100),
      overUnderLine: raw.probabilities?.overUnderLine ?? request.matchData.odds.overUnderLine ?? null,
      over: clampNullable(raw.probabilities?.over, 0, 100),
      under: clampNullable(raw.probabilities?.under, 0, 100),
    },
    
    valueAnalysis: {
      impliedProbabilities: {
        homeWin: clampNullable(raw.valueAnalysis?.impliedProbabilities?.homeWin, 0, 100),
        draw: clampNullable(raw.valueAnalysis?.impliedProbabilities?.draw, 0, 100),
        awayWin: clampNullable(raw.valueAnalysis?.impliedProbabilities?.awayWin, 0, 100),
      },
      valueFlags: {
        homeWin: validateValueFlag(raw.valueAnalysis?.valueFlags?.homeWin),
        draw: validateValueFlag(raw.valueAnalysis?.valueFlags?.draw),
        awayWin: validateValueFlag(raw.valueAnalysis?.valueFlags?.awayWin),
      },
      bestValueSide: validateBestValueSide(raw.valueAnalysis?.bestValueSide),
      valueCommentShort: raw.valueAnalysis?.valueCommentShort ?? 'No value assessment available.',
      valueCommentDetailed: raw.valueAnalysis?.valueCommentDetailed ?? 'Detailed analysis not available.',
    },
    
    riskAnalysis: {
      overallRiskLevel: validateRiskLevel(raw.riskAnalysis?.overallRiskLevel),
      riskExplanation: raw.riskAnalysis?.riskExplanation ?? 'Risk assessment not available.',
      bankrollImpact: raw.riskAnalysis?.bankrollImpact ?? 'Consider your bankroll limits.',
      psychologicalBias: {
        name: raw.riskAnalysis?.psychologicalBias?.name ?? 'General Caution',
        description: raw.riskAnalysis?.psychologicalBias?.description ?? 'Be aware of cognitive biases when analyzing matches.',
      },
    },
    
    momentumAndForm: {
      homeMomentumScore: clampNullable(raw.momentumAndForm?.homeMomentumScore, 1, 10),
      awayMomentumScore: clampNullable(raw.momentumAndForm?.awayMomentumScore, 1, 10),
      homeTrend: validateTrend(raw.momentumAndForm?.homeTrend),
      awayTrend: validateTrend(raw.momentumAndForm?.awayTrend),
      keyFormFactors: Array.isArray(raw.momentumAndForm?.keyFormFactors) 
        ? raw.momentumAndForm.keyFormFactors 
        : ['Form data not available'],
    },
    
    marketStability: {
      markets: {
        main_1x2: validateMarketStabilityItem(raw.marketStability?.markets?.main_1x2),
        over_under: validateMarketStabilityItem(raw.marketStability?.markets?.over_under),
        btts: validateMarketStabilityItem(raw.marketStability?.markets?.btts),
      },
      safestMarketType: validateMarketType(raw.marketStability?.safestMarketType),
      safestMarketExplanation: raw.marketStability?.safestMarketExplanation ?? 'Market stability analysis not available.',
    },
    
    upsetPotential: {
      upsetProbability: clamp(raw.upsetPotential?.upsetProbability ?? 25, 0, 100),
      upsetComment: raw.upsetPotential?.upsetComment ?? 'Upset potential assessment not available.',
    },
    
    tacticalAnalysis: {
      stylesSummary: raw.tacticalAnalysis?.stylesSummary ?? 'Playing style analysis not available.',
      matchNarrative: raw.tacticalAnalysis?.matchNarrative ?? 'Match narrative not available.',
      keyMatchFactors: Array.isArray(raw.tacticalAnalysis?.keyMatchFactors)
        ? raw.tacticalAnalysis.keyMatchFactors
        : ['Key factors not available'],
      expertConclusionOneLiner: raw.tacticalAnalysis?.expertConclusionOneLiner ?? 'A match with uncertain outcome.',
    },
    
    userContext: {
      userPick: request.userPick ?? null,
      userStake: request.userStake ?? null,
      pickComment: raw.userContext?.pickComment ?? 'No specific commentary on your selection.',
    },
    
    responsibleGambling: {
      coreNote: raw.responsibleGambling?.coreNote ?? 
        'This analysis is for educational purposes only. It does not constitute betting advice and no outcome is guaranteed.',
      tailoredNote: raw.responsibleGambling?.tailoredNote ?? 
        'Always bet responsibly and only with money you can afford to lose.',
    },
    
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      dataSourcesUsed: Array.isArray(raw.meta?.dataSourcesUsed)
        ? raw.meta.dataSourcesUsed
        : [request.matchData.sourceType === 'API' ? 'The Odds API' : 'Manual Input'],
      warnings: Array.isArray(raw.meta?.warnings) ? raw.meta.warnings : [],
    },
    
    error: raw.error,
  };
}

// ============================================
// VALIDATION HELPERS
// ============================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampNullable(value: any, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return clamp(num, min, max);
}

function validateRiskLevel(level: any): RiskLevel {
  const valid: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(level).toUpperCase();
  return valid.includes(normalized as RiskLevel) ? (normalized as RiskLevel) : 'MEDIUM';
}

function validateValueFlag(flag: any): ValueFlag {
  const valid: ValueFlag[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(flag).toUpperCase();
  return valid.includes(normalized as ValueFlag) ? (normalized as ValueFlag) : 'NONE';
}

function validateTrend(trend: any): Trend {
  const valid: Trend[] = ['RISING', 'FALLING', 'STABLE', 'UNKNOWN'];
  const normalized = String(trend).toUpperCase();
  return valid.includes(normalized as Trend) ? (normalized as Trend) : 'UNKNOWN';
}

function validateDataQuality(quality: any): DataQuality {
  const valid: DataQuality[] = ['LOW', 'MEDIUM', 'HIGH'];
  const normalized = String(quality).toUpperCase();
  return valid.includes(normalized as DataQuality) ? (normalized as DataQuality) : 'MEDIUM';
}

function validateSourceType(source: any): 'MANUAL' | 'API' {
  return source === 'API' ? 'API' : 'MANUAL';
}

function validateBestValueSide(side: any): BestValueSide {
  const valid: BestValueSide[] = ['HOME', 'DRAW', 'AWAY', 'NONE'];
  const normalized = String(side).toUpperCase();
  return valid.includes(normalized as BestValueSide) ? (normalized as BestValueSide) : 'NONE';
}

function validateMarketType(type: any): MarketType {
  const valid: MarketType[] = ['1X2', 'OVER_UNDER', 'BTTS', 'NONE'];
  const normalized = String(type).toUpperCase();
  return valid.includes(normalized as MarketType) ? (normalized as MarketType) : 'NONE';
}

function validateMarketStabilityItem(item: any): { stability: RiskLevel; confidence: 1 | 2 | 3 | 4 | 5; comment: string } {
  return {
    stability: validateRiskLevel(item?.stability),
    confidence: clamp(item?.confidence ?? 3, 1, 5) as 1 | 2 | 3 | 4 | 5,
    comment: item?.comment ?? 'Market analysis not available.',
  };
}

// ============================================
// ERROR RESPONSE
// ============================================

function createErrorResponse(error: string): AnalyzeResponseV2 {
  const now = new Date().toISOString();
  
  return {
    success: false,
    confidenceScore: 0,
    matchInfo: {
      matchId: null,
      sport: 'Unknown',
      leagueName: 'Unknown',
      matchDate: now,
      homeTeam: 'Unknown',
      awayTeam: 'Unknown',
      sourceType: 'MANUAL',
      dataQuality: 'LOW',
    },
    probabilities: {
      homeWin: null,
      draw: null,
      awayWin: null,
      overUnderLine: null,
      over: null,
      under: null,
    },
    valueAnalysis: {
      impliedProbabilities: { homeWin: null, draw: null, awayWin: null },
      valueFlags: { homeWin: 'NONE', draw: 'NONE', awayWin: 'NONE' },
      bestValueSide: 'NONE',
      valueCommentShort: 'Analysis unavailable.',
      valueCommentDetailed: 'Analysis unavailable.',
    },
    riskAnalysis: {
      overallRiskLevel: 'HIGH',
      riskExplanation: 'Unable to assess risk due to error.',
      bankrollImpact: 'Exercise caution.',
      psychologicalBias: { name: 'N/A', description: 'N/A' },
    },
    momentumAndForm: {
      homeMomentumScore: null,
      awayMomentumScore: null,
      homeTrend: 'UNKNOWN',
      awayTrend: 'UNKNOWN',
      keyFormFactors: [],
    },
    marketStability: {
      markets: {
        main_1x2: { stability: 'LOW', confidence: 1, comment: 'N/A' },
        over_under: { stability: 'LOW', confidence: 1, comment: 'N/A' },
        btts: { stability: 'LOW', confidence: 1, comment: 'N/A' },
      },
      safestMarketType: 'NONE',
      safestMarketExplanation: 'N/A',
    },
    upsetPotential: {
      upsetProbability: 0,
      upsetComment: 'N/A',
    },
    tacticalAnalysis: {
      stylesSummary: 'N/A',
      matchNarrative: 'N/A',
      keyMatchFactors: [],
      expertConclusionOneLiner: 'Analysis unavailable.',
    },
    userContext: {
      userPick: null,
      userStake: null,
      pickComment: 'N/A',
    },
    responsibleGambling: {
      coreNote: 'This analysis is for educational purposes only.',
      tailoredNote: 'Always bet responsibly.',
    },
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      dataSourcesUsed: [],
      warnings: ['Analysis failed due to an error.'],
    },
    error,
  };
}

// ============================================
// FALLBACK ANALYSIS (NO OPENAI)
// ============================================

function generateFallbackAnalysis(request: AnalyzeRequestV2): AnalyzeResponseV2 {
  const now = new Date().toISOString();
  const { matchData, userPick, userStake } = request;

  // Calculate implied probabilities from odds
  const homeOdds = matchData.odds.home || 2;
  const drawOdds = matchData.odds.draw || 3.5;
  const awayOdds = matchData.odds.away || 2;

  const impliedHome = (1 / homeOdds) * 100;
  const impliedDraw = drawOdds ? (1 / drawOdds) * 100 : null;
  const impliedAway = (1 / awayOdds) * 100;

  // Normalize to ~100%
  const total = impliedHome + (impliedDraw || 0) + impliedAway;
  const margin = total - 100;

  const homeWin = Math.round(impliedHome * (100 / total));
  const draw = impliedDraw ? Math.round(impliedDraw * (100 / total)) : null;
  const awayWin = Math.round(impliedAway * (100 / total));

  // Determine risk level
  let riskLevel: RiskLevel = 'MEDIUM';
  const maxOdds = Math.max(homeOdds, awayOdds);
  if (maxOdds > 3.5) riskLevel = 'HIGH';
  else if (maxOdds < 1.8) riskLevel = 'LOW';

  // Determine favorite and underdog
  const homeFavorite = homeOdds < awayOdds;
  const upsetProb = homeFavorite ? awayWin : homeWin;

  return {
    success: true,
    confidenceScore: 45,
    
    matchInfo: {
      matchId: matchData.matchId ?? null,
      sport: matchData.sport || 'Soccer',
      leagueName: matchData.league || 'Unknown League',
      matchDate: matchData.matchDate || now,
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      sourceType: matchData.sourceType || 'MANUAL',
      dataQuality: 'LOW',
    },
    
    probabilities: {
      homeWin,
      draw,
      awayWin,
      overUnderLine: matchData.odds.overUnderLine ?? null,
      over: null,
      under: null,
    },
    
    valueAnalysis: {
      impliedProbabilities: {
        homeWin: Math.round(impliedHome * 100) / 100,
        draw: impliedDraw ? Math.round(impliedDraw * 100) / 100 : null,
        awayWin: Math.round(impliedAway * 100) / 100,
      },
      valueFlags: {
        homeWin: 'NONE',
        draw: 'NONE',
        awayWin: 'NONE',
      },
      bestValueSide: 'NONE',
      valueCommentShort: `Analysis based on odds only. Bookmaker margin: ${margin.toFixed(1)}%.`,
      valueCommentDetailed: 'This is a fallback analysis based solely on provided odds. For detailed AI analysis, ensure the OpenAI API key is configured.',
    },
    
    riskAnalysis: {
      overallRiskLevel: riskLevel,
      riskExplanation: `Risk level determined by odds spread. Maximum odds: ${maxOdds.toFixed(2)}.`,
      bankrollImpact: 'Without detailed analysis, consider reducing stake size.',
      psychologicalBias: {
        name: 'Insufficient Data Bias',
        description: 'Be cautious when making decisions with limited information.',
      },
    },
    
    momentumAndForm: {
      homeMomentumScore: null,
      awayMomentumScore: null,
      homeTrend: 'UNKNOWN',
      awayTrend: 'UNKNOWN',
      keyFormFactors: ['Form data not available in fallback mode'],
    },
    
    marketStability: {
      markets: {
        main_1x2: { stability: 'MEDIUM', confidence: 2, comment: 'Basic odds-based assessment' },
        over_under: { stability: 'LOW', confidence: 1, comment: 'No over/under analysis available' },
        btts: { stability: 'LOW', confidence: 1, comment: 'No BTTS analysis available' },
      },
      safestMarketType: 'NONE',
      safestMarketExplanation: 'Insufficient data to recommend a specific market.',
    },
    
    upsetPotential: {
      upsetProbability: upsetProb || 30,
      upsetComment: `Based on odds, the underdog has approximately ${upsetProb}% chance of winning.`,
    },
    
    tacticalAnalysis: {
      stylesSummary: 'Tactical analysis requires AI processing.',
      matchNarrative: `${matchData.homeTeam} vs ${matchData.awayTeam} - detailed narrative unavailable in fallback mode.`,
      keyMatchFactors: ['Odds-based analysis only', 'No form or tactical data available'],
      expertConclusionOneLiner: 'A match requiring further analysis for confident assessment.',
    },
    
    userContext: {
      userPick: userPick ?? null,
      userStake: userStake ?? null,
      pickComment: userPick 
        ? 'Your selection has been noted. Consider the limited analysis available.'
        : 'No selection provided.',
    },
    
    responsibleGambling: {
      coreNote: 'This analysis is for educational purposes only. It does not constitute betting advice and no outcome is guaranteed.',
      tailoredNote: userStake 
        ? `With a €${userStake} stake, ensure this is within your entertainment budget.`
        : 'Always bet responsibly and only with money you can afford to lose.',
    },
    
    meta: {
      modelVersion: '1.0.0',
      analysisGeneratedAt: now,
      dataSourcesUsed: ['Manual Input', 'Odds Calculation'],
      warnings: [
        'AI analysis unavailable - using fallback odds-based calculation',
        'Limited data quality - exercise additional caution',
      ],
    },
  };
}
