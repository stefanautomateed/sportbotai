/**
 * Chat Tool Dependencies
 * 
 * These functions implement the actual data fetching for each chat tool.
 * They connect to our verified data sources, predictions DB, and Perplexity.
 */

import { getUpcomingMatchPrediction, formatMatchPredictionContext, checkIfMatchIsInPast } from './verified-match-prediction';
import { getVerifiedPlayerStats, formatVerifiedPlayerStats } from './verified-nba-stats';
import { getVerifiedNFLPlayerStats, formatVerifiedNFLPlayerStats } from './verified-nfl-stats';
import { getVerifiedNHLPlayerStats, formatVerifiedNHLPlayerStats } from './verified-nhl-stats';
import { getVerifiedSoccerPlayerStats, formatVerifiedSoccerPlayerStats } from './verified-soccer-stats';
import { prisma } from './prisma';

// ============================================
// PERPLEXITY SEARCH
// ============================================

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function searchWithPerplexity(query: string): Promise<string> {
    if (!PERPLEXITY_API_KEY) {
        return 'Real-time search is not configured.';
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a sports data assistant. Provide concise, factual information. Focus on current/recent data.'
                    },
                    { role: 'user', content: query }
                ],
                max_tokens: 500,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            console.error('[ToolDeps] Perplexity error:', response.status);
            return 'Unable to fetch real-time data.';
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No data found.';
    } catch (error) {
        console.error('[ToolDeps] Search error:', error);
        return 'Search failed.';
    }
}

// ============================================
// TOOL DEPENDENCIES
// ============================================

/**
 * Search sports news via Perplexity
 */
export async function searchNews(query: string, topic?: string): Promise<string> {
    const topicPrefix = topic ? `${topic}: ` : '';
    const searchQuery = `${topicPrefix}${query} sports news latest updates`;

    console.log(`[ToolDeps] Searching news: "${searchQuery}"`);
    return searchWithPerplexity(searchQuery);
}

/**
 * Get player injury status
 */
export async function getInjuryStatus(playerName: string, team?: string): Promise<string> {
    console.log(`[ToolDeps] Getting injury status for: ${playerName}`);

    // Search for injury news via Perplexity (real-time)
    const query = `${playerName}${team ? ` ${team}` : ''} injury status availability latest news`;
    const result = await searchWithPerplexity(query);

    return `**Injury Status for ${playerName}**\n\n${result}`;
}

/**
 * Get player stats from verified sources
 */
export async function getPlayerStats(playerName: string, sport: string): Promise<string> {
    console.log(`[ToolDeps] Getting stats for: ${playerName} (${sport})`);

    try {
        let stats: unknown = null;
        let formatted = '';

        switch (sport.toLowerCase()) {
            case 'basketball':
            case 'nba':
                stats = await getVerifiedPlayerStats(playerName);
                if (stats) {
                    formatted = formatVerifiedPlayerStats(stats as Parameters<typeof formatVerifiedPlayerStats>[0]);
                }
                break;

            case 'american_football':
            case 'nfl':
                stats = await getVerifiedNFLPlayerStats(playerName);
                if (stats) {
                    formatted = formatVerifiedNFLPlayerStats(stats as Parameters<typeof formatVerifiedNFLPlayerStats>[0]);
                }
                break;

            case 'hockey':
            case 'nhl':
                stats = await getVerifiedNHLPlayerStats(playerName);
                if (stats) {
                    formatted = formatVerifiedNHLPlayerStats(stats as Parameters<typeof formatVerifiedNHLPlayerStats>[0]);
                }
                break;

            case 'soccer':
            case 'football':
                stats = await getVerifiedSoccerPlayerStats(playerName);
                if (stats) {
                    formatted = formatVerifiedSoccerPlayerStats(stats as Parameters<typeof formatVerifiedSoccerPlayerStats>[0]);
                }
                break;
        }

        if (formatted) {
            return formatted;
        }

        // Fallback to Perplexity search
        console.log(`[ToolDeps] No verified stats found, using search...`);
        return searchWithPerplexity(`${playerName} current season stats statistics 2025-26`);

    } catch (error) {
        console.error('[ToolDeps] Stats error:', error);
        return searchWithPerplexity(`${playerName} current season stats statistics 2025-26`);
    }
}

/**
 * Get match prediction from our database
 */
export async function getMatchPrediction(team1: string, team2: string, sport: string): Promise<string> {
    console.log(`[ToolDeps] Getting prediction for: ${team1} vs ${team2}`);

    // First check if match is in the past
    const message = `${team1} vs ${team2}`;
    const pastCheck = await checkIfMatchIsInPast(message);

    if (pastCheck.isPast) {
        let response = `⚠️ **This match has already been played!**\n\n`;
        response += `**${pastCheck.matchName}** was played ${pastCheck.hoursAgo} hours ago.\n\n`;

        if (pastCheck.actualResult) {
            response += `**Final Result:** ${pastCheck.actualResult}\n\n`;
        }

        if (pastCheck.outcome && pastCheck.prediction) {
            const emoji = pastCheck.outcome === 'HIT' ? '✅' : pastCheck.outcome === 'MISS' ? '❌' : '⏳';
            response += `**Our Prediction:** ${pastCheck.prediction} ${emoji}\n`;
        }

        return response;
    }

    // Get upcoming prediction
    const result = await getUpcomingMatchPrediction(message);

    if (result.success && result.data) {
        return formatMatchPredictionContext(result);
    } else if (result.error) {
        return `No prediction available: ${result.error}`;
    }

    return `We don't have a stored prediction for ${team1} vs ${team2} yet.`;
}

/**
 * Get team recent form
 */
export async function getTeamForm(teamName: string, sport: string): Promise<string> {
    console.log(`[ToolDeps] Getting form for: ${teamName}`);

    // Try to get recent predictions/results from DB
    try {
        const now = new Date();
        const past14days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const recentMatches = await prisma.prediction.findMany({
            where: {
                matchName: { contains: teamName, mode: 'insensitive' },
                kickoff: { gte: past14days, lt: now },
                actualResult: { not: null },
            },
            orderBy: { kickoff: 'desc' },
            take: 5,
            select: {
                matchName: true,
                kickoff: true,
                actualResult: true,
                outcome: true,
                prediction: true,
            },
        });

        if (recentMatches.length > 0) {
            let form = `**Recent Form for ${teamName}** (Last ${recentMatches.length} games)\n\n`;

            for (const match of recentMatches) {
                const date = match.kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                form += `• ${date}: ${match.matchName} - ${match.actualResult || 'Result pending'}\n`;
            }

            return form;
        }
    } catch (error) {
        console.error('[ToolDeps] Form lookup error:', error);
    }

    // Fallback to Perplexity
    return searchWithPerplexity(`${teamName} recent results form last 5 games`);
}

/**
 * Get league standings
 */
export async function getStandings(league: string): Promise<string> {
    console.log(`[ToolDeps] Getting standings for: ${league}`);

    // Use Perplexity for real-time standings
    return searchWithPerplexity(`${league} current standings table 2025-26 season top teams`);
}
