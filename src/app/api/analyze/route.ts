/**
 * API Route: /api/analyze
 * 
 * Endpoint for AI sports match analysis using OpenAI GPT-4.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AnalyzeRequest, AnalyzeResponse, RiskLevel } from '@/types';

// Lazy-initialized OpenAI client (to avoid build-time errors)
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

/**
 * POST /api/analyze
 * 
 * Receives match data and returns AI analysis.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequest = await request.json();

    // Check if API key is configured
    const openai = getOpenAIClient();
    if (!openai) {
      console.warn('OPENAI_API_KEY not configured, using mock response');
      return NextResponse.json(generateMockAnalysis(body));
    }

    // Validate required fields
    if (!body.sport || !body.league || !body.teamA || !body.teamB) {
      return NextResponse.json(
        { error: 'Missing required fields: sport, league, teamA, teamB' },
        { status: 400 }
      );
    }

    if (!body.odds || body.odds.home <= 0 || body.odds.away <= 0) {
      return NextResponse.json(
        { error: 'Odds must be greater than 0' },
        { status: 400 }
      );
    }

    // Create prompt for OpenAI
    const prompt = `You are an expert sports analyst. Analyze the following match and provide an objective assessment.

MATCH:
- Sport: ${body.sport}
- League: ${body.league}
- Home Team: ${body.teamA}
- Away Team: ${body.teamB}
- Odds: 1 (home) = ${body.odds.home}, X (draw) = ${body.odds.draw || 'N/A'}, 2 (away) = ${body.odds.away}
${body.userPrediction ? `- User's prediction: ${body.userPrediction}` : ''}
${body.stake ? `- Planned stake: €${body.stake}` : ''}

TASK:
1. Estimate outcome probabilities (homeWin, draw, awayWin) as percentages (0-100)
2. Compare your estimates with implied probability from odds
3. Identify if there is value in any odds
4. Determine risk level (LOW, MEDIUM, HIGH)
5. Write a brief analysis summary

IMPORTANT:
- Be objective and realistic
- Do not guarantee outcomes
- Include responsible gambling disclaimer
- If you don't know enough about the teams, use odds as the main indicator

Respond ONLY in JSON format:
{
  "probabilities": {
    "homeWin": <number 0-100>,
    "draw": <number 0-100 or null if no draw option>,
    "awayWin": <number 0-100>
  },
  "valueComment": "<comment about value bets>",
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "analysisSummary": "<detailed analysis, 2-3 sentences>"
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant for sports analysis. Always respond in English and return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Parse AI response
    const aiContent = completion.choices[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', aiContent);
      return NextResponse.json(generateMockAnalysis(body));
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    // Validate and format response
    const response: AnalyzeResponse = {
      probabilities: {
        homeWin: Math.min(100, Math.max(0, aiResponse.probabilities?.homeWin || 33)),
        draw: aiResponse.probabilities?.draw ?? null,
        awayWin: Math.min(100, Math.max(0, aiResponse.probabilities?.awayWin || 33)),
        over: null,
        under: null,
      },
      valueComment: aiResponse.valueComment || 'Odds analysis not available.',
      riskLevel: validateRiskLevel(aiResponse.riskLevel),
      analysisSummary: aiResponse.analysisSummary || 'Analysis not available.',
      responsibleGamblingNote:
        'This analysis is for informational purposes only and does not constitute financial advice. Betting carries the risk of losing money. Never bet with money you cannot afford to lose. If you feel you have a gambling problem, seek help at begambleaware.org or call 1-800-522-4700.',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    
    // If OpenAI error, return mock
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validates risk level string
 */
function validateRiskLevel(level: string): RiskLevel {
  const normalized = level?.toUpperCase?.();
  if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH') {
    return normalized as RiskLevel;
  }
  return 'MEDIUM';
}

/**
 * Fallback: Generates mock analysis if OpenAI is not available
 */
function generateMockAnalysis(data: AnalyzeRequest): AnalyzeResponse {
  const impliedHomeWin = data.odds?.home > 0 ? (1 / data.odds.home) * 100 : 33;
  const impliedDraw = data.odds?.draw > 0 ? (1 / data.odds.draw) * 100 : 33;
  const impliedAwayWin = data.odds?.away > 0 ? (1 / data.odds.away) * 100 : 33;

  const total = impliedHomeWin + impliedDraw + impliedAwayWin;
  const adjustmentFactor = total > 0 ? 100 / total : 1;

  const homeWin = Math.round(impliedHomeWin * adjustmentFactor);
  const draw = data.odds?.draw > 0 ? Math.round(impliedDraw * adjustmentFactor) : null;
  const awayWin = Math.round(impliedAwayWin * adjustmentFactor);

  let riskLevel: RiskLevel = 'MEDIUM';
  const maxOdds = Math.max(data.odds?.home || 2, data.odds?.away || 2);
  if (maxOdds > 3.5) riskLevel = 'HIGH';
  else if (maxOdds < 1.8) riskLevel = 'LOW';

  return {
    probabilities: { homeWin, draw, awayWin, over: null, under: null },
    valueComment: `Analysis based on odds. Bookmaker margin: ${(total - 100).toFixed(1)}%.`,
    riskLevel,
    analysisSummary: `Match ${data.teamA || 'Team A'} vs ${data.teamB || 'Team B'}: Home ${homeWin}%, ${draw !== null ? `draw ${draw}%, ` : ''}away ${awayWin}%.`,
    responsibleGamblingNote:
      'This analysis is for informational purposes only. Betting carries the risk of losing money.',
  };
}
