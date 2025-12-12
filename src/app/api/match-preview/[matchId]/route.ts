/**
 * Match Preview API
 * 
 * Fetches and assembles all match preview data:
 * - Match info from The Odds API
 * - Form data from API-Football
 * - H2H data from API-Football
 * - Injuries from API-Football  
 * - AI-generated headlines and briefing from OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedMatchData } from '@/lib/football-api';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;

    // Parse match ID to extract teams
    const matchInfo = parseMatchId(matchId);
    
    if (!matchInfo) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Fetch enriched data from API-Football
    const enrichedData = await getEnrichedMatchData(
      matchInfo.homeTeam,
      matchInfo.awayTeam,
      matchInfo.league
    );

    // Format form data
    const formData = {
      home: {
        recent: enrichedData.homeForm?.map(m => m.result).join('') || 'DDDDD',
        trend: determineTrend(enrichedData.homeForm?.map(m => m.result).join('') || ''),
        goalsScored: enrichedData.homeStats?.goalsScored || 0,
        goalsConceded: enrichedData.homeStats?.goalsConceded || 0,
        lastMatches: enrichedData.homeForm?.slice(0, 5).map(m => ({
          opponent: m.opponent,
          result: m.result,
          score: m.score,
          date: m.date,
          home: m.home,
        })) || [],
      },
      away: {
        recent: enrichedData.awayForm?.map(m => m.result).join('') || 'DDDDD',
        trend: determineTrend(enrichedData.awayForm?.map(m => m.result).join('') || ''),
        goalsScored: enrichedData.awayStats?.goalsScored || 0,
        goalsConceded: enrichedData.awayStats?.goalsConceded || 0,
        lastMatches: enrichedData.awayForm?.slice(0, 5).map(m => ({
          opponent: m.opponent,
          result: m.result,
          score: m.score,
          date: m.date,
          home: m.home,
        })) || [],
      },
    };

    // Format H2H data
    const h2hData = {
      totalMeetings: enrichedData.h2hSummary?.totalMatches || 0,
      homeWins: enrichedData.h2hSummary?.homeWins || 0,
      awayWins: enrichedData.h2hSummary?.awayWins || 0,
      draws: enrichedData.h2hSummary?.draws || 0,
      recentMeetings: enrichedData.headToHead?.slice(0, 5).map(h => ({
        date: h.date,
        homeTeam: h.homeTeam,
        awayTeam: h.awayTeam,
        score: `${h.homeScore} - ${h.awayScore}`,
        venue: '',
      })) || [],
    };

    // Placeholder absences (API-Football injuries requires paid plan)
    const absencesData = { home: [], away: [] };

    // Generate AI content
    const aiContent = await generateAIContent(matchInfo, formData, h2hData);

    const response = {
      matchInfo: {
        id: matchId,
        homeTeam: matchInfo.homeTeam,
        awayTeam: matchInfo.awayTeam,
        league: matchInfo.league,
        sport: 'soccer',
        kickoff: matchInfo.kickoff,
        venue: matchInfo.venue,
      },
      headlines: aiContent.headlines,
      form: formData,
      h2h: h2hData,
      absences: absencesData,
      briefing: aiContent.briefing,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Match preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate match preview' },
      { status: 500 }
    );
  }
}

/**
 * Parse match ID to extract match information
 * Format: base64 encoded JSON or "home-team_away-team_league_timestamp"
 */
function parseMatchId(matchId: string) {
  try {
    // Try to decode if it's a base64 encoded object
    const decoded = Buffer.from(matchId, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      league: parsed.league,
      kickoff: parsed.kickoff || new Date().toISOString(),
      venue: parsed.venue || null,
    };
  } catch {
    // If decoding fails, try to parse as slug format
    // Format: home-team_away-team_league_timestamp
    const parts = matchId.split('_');
    if (parts.length >= 3) {
      return {
        homeTeam: parts[0].replace(/-/g, ' '),
        awayTeam: parts[1].replace(/-/g, ' '),
        league: parts[2].replace(/-/g, ' '),
        kickoff: parts[3] ? new Date(parseInt(parts[3])).toISOString() : new Date().toISOString(),
        venue: null,
      };
    }
    return null;
  }
}

function determineTrend(form: string): 'up' | 'down' | 'stable' {
  if (!form) return 'stable';
  const recent = form.slice(-3);
  const wins = (recent.match(/W/g) || []).length;
  const losses = (recent.match(/L/g) || []).length;
  
  if (wins >= 2) return 'up';
  if (losses >= 2) return 'down';
  return 'stable';
}

/**
 * Generate AI headlines and briefing
 */
async function generateAIContent(
  matchInfo: { homeTeam: string; awayTeam: string; league: string; kickoff: string },
  form: { home: { recent: string; goalsScored: number; goalsConceded: number }; away: { recent: string; goalsScored: number; goalsConceded: number } },
  h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number }
) {
  const prompt = `You are a sports analyst creating a pre-match preview for ${matchInfo.homeTeam} vs ${matchInfo.awayTeam} in ${matchInfo.league}.

Match Date: ${matchInfo.kickoff}

Data available:
- Home team recent form: ${form.home.recent} (Goals: ${form.home.goalsScored} scored, ${form.home.goalsConceded} conceded)
- Away team recent form: ${form.away.recent} (Goals: ${form.away.goalsScored} scored, ${form.away.goalsConceded} conceded)
- H2H: ${h2h.totalMeetings} meetings - Home wins: ${h2h.homeWins}, Away wins: ${h2h.awayWins}, Draws: ${h2h.draws}

Generate:
1. 3-4 "headline" facts that would be shareable/viral (think stat nuggets, streaks, historical facts)
2. A 2-3 sentence summary of what makes this match interesting
3. 3-4 key tactical/analytical points to watch

Return as JSON:
{
  "headlines": [
    { "icon": "🔥", "text": "Headline text here", "category": "form|h2h|streak|stat", "impactLevel": "high|medium|low" }
  ],
  "briefing": {
    "summary": "2-3 sentence match summary",
    "keyPoints": ["Point 1", "Point 2", "Point 3"]
  }
}

Keep it factual and engaging. No betting advice.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned');
    }

    return JSON.parse(content) as {
      headlines: Array<{ icon: string; text: string; category: string; impactLevel: 'high' | 'medium' | 'low' }>;
      briefing: { summary: string; keyPoints: string[] };
    };
  } catch (error) {
    console.error('AI content generation failed:', error);
    // Return fallback content
    return {
      headlines: [
        {
          icon: '⚽',
          text: `${matchInfo.homeTeam} hosts ${matchInfo.awayTeam} in ${matchInfo.league}`,
          category: 'match',
          impactLevel: 'medium' as const,
        },
      ],
      briefing: {
        summary: `${matchInfo.homeTeam} takes on ${matchInfo.awayTeam} in what promises to be an exciting ${matchInfo.league} fixture.`,
        keyPoints: [
          'Both teams looking for important points',
          'Form could be crucial in determining the outcome',
          'Key players to watch on both sides',
        ],
      },
    };
  }
}
