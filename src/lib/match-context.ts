/**
 * Match Context Data Service
 * 
 * Fetches additional context for match analysis:
 * - Injuries & Suspensions (from API-Football)
 * - Weather conditions (from OpenWeatherMap)
 * - Venue information
 * 
 * This data enriches the AI analysis with real-world factors.
 */

import { cacheGet, cacheSet, CACHE_TTL } from './cache';

// ============================================
// TYPES
// ============================================

export interface InjuredPlayer {
  name: string;
  position: string;
  reason: string; // "Injury", "Suspension", "Doubtful"
  type: 'injury' | 'suspension' | 'doubtful';
}

export interface TeamInjuries {
  teamName: string;
  players: InjuredPlayer[];
  lastUpdated: string;
}

export interface WeatherData {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  description: string;
  icon: string;
  precipitation: number; // mm
  isIndoor: boolean;
}

export interface VenueInfo {
  name: string;
  city: string;
  capacity: number;
  surface: string; // "grass", "artificial", "indoor"
  isNeutral: boolean;
}

export interface MatchContext {
  homeInjuries: InjuredPlayer[] | null;
  awayInjuries: InjuredPlayer[] | null;
  weather: WeatherData | null;
  venue: VenueInfo | null;
  dataAvailable: boolean;
}

// ============================================
// API-FOOTBALL INJURIES
// ============================================

async function fetchSoccerInjuries(
  teamId: number,
  teamName: string
): Promise<TeamInjuries | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;

  const cacheKey = `injuries:soccer:${teamId}`;
  const cached = await cacheGet<TeamInjuries>(cacheKey);
  if (cached) return cached;

  try {
    // Get current season
    const now = new Date();
    const season = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

    const response = await fetch(
      `https://v3.football.api-sports.io/injuries?team=${teamId}&season=${season}`,
      {
        headers: { 'x-apisports-key': apiKey },
      }
    );

    if (!response.ok) {
      console.error(`[Injuries] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.response || data.response.length === 0) {
      console.log(`[Injuries] No injury data for team ${teamId}`);
      return null;
    }

    // Get recent injuries (last 30 days or still active)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // API-Football returns one entry per fixture missed, so we need to deduplicate
    const recentInjuries = data.response.filter((injury: any) => {
      const fixtureDate = new Date(injury.fixture?.date || '');
      return fixtureDate >= thirtyDaysAgo;
    });

    // Deduplicate by player ID first (most reliable), then by normalized name as fallback
    const playerMap = new Map<string, any>();
    recentInjuries.forEach((injury: any) => {
      // Use player ID if available, otherwise use normalized name
      const playerId = injury.player?.id;
      const playerName = injury.player?.name || 'Unknown';
      // Normalize name: lowercase, trim, remove accents for comparison
      const normalizedName = playerName.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Create a unique key - prefer ID, fallback to normalized name
      const key = playerId ? `id:${playerId}` : `name:${normalizedName}`;
      
      const fixtureDate = new Date(injury.fixture?.date || '');
      const existing = playerMap.get(key);
      
      // Keep the most recent injury entry for each player
      if (!existing || fixtureDate > new Date(existing.fixture?.date || '')) {
        playerMap.set(key, injury);
      }
    });

    // Map to player objects and do a final name-based deduplication
    const uniquePlayers = Array.from(playerMap.values())
      .map((injury: any) => ({
        name: injury.player?.name || 'Unknown',
        position: injury.player?.type || 'Unknown',
        reason: injury.player?.reason || 'Unknown',
        type: (injury.player?.reason?.toLowerCase().includes('suspend') 
          ? 'suspension' 
          : injury.player?.reason?.toLowerCase().includes('doubt')
            ? 'doubtful'
            : 'injury') as InjuredPlayer['type'],
      }));
    
    // Final deduplication by display name (in case ID-based missed some)
    const seenNames = new Set<string>();
    const players: InjuredPlayer[] = uniquePlayers.filter(p => {
      const normalizedName = p.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    }).slice(0, 10);

    const result: TeamInjuries = {
      teamName,
      players,
      lastUpdated: new Date().toISOString(),
    };

    // Use shorter cache TTL of 2 minutes to ensure fresh data
    await cacheSet(cacheKey, result, 2 * 60);
    console.log(`[Injuries] Found ${players.length} unique injuries for ${teamName} (from ${data.response.length} raw entries)`);
    
    return result;
  } catch (error) {
    console.error('[Injuries] Error fetching injuries:', error);
    return null;
  }
}

// ============================================
// WEATHER DATA (OpenWeatherMap)
// ============================================

async function fetchWeather(
  city: string,
  isIndoorSport: boolean = false
): Promise<WeatherData | null> {
  // Indoor sports don't need weather
  if (isIndoorSport) {
    return {
      temperature: 20,
      feelsLike: 20,
      humidity: 50,
      windSpeed: 0,
      description: 'Indoor venue',
      icon: '🏟️',
      precipitation: 0,
      isIndoor: true,
    };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  console.log(`[Weather] API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);
  if (!apiKey) {
    console.log('[Weather] OPENWEATHER_API_KEY not configured');
    return null;
  }

  const cacheKey = `weather:${city.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = await cacheGet<WeatherData>(cacheKey);
  if (cached) {
    console.log(`[Weather] Cache hit for ${city}`);
    return cached;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    console.log(`[Weather] Fetching from OpenWeatherMap for city: ${city}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Weather] API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();

    const weatherIcons: Record<string, string> = {
      '01': '☀️',
      '02': '⛅',
      '03': '☁️',
      '04': '☁️',
      '09': '🌧️',
      '10': '🌦️',
      '11': '⛈️',
      '13': '❄️',
      '50': '🌫️',
    };

    const iconCode = data.weather?.[0]?.icon?.slice(0, 2) || '01';

    const result: WeatherData = {
      temperature: Math.round(data.main?.temp || 20),
      feelsLike: Math.round(data.main?.feels_like || 20),
      humidity: data.main?.humidity || 50,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      description: data.weather?.[0]?.description || 'Unknown',
      icon: weatherIcons[iconCode] || '🌤️',
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      isIndoor: false,
    };

    await cacheSet(cacheKey, result, 30 * 60); // 30 min cache for weather
    console.log(`[Weather] ${city}: ${result.temperature}°C, ${result.description}`);

    return result;
  } catch (error) {
    console.error('[Weather] Error fetching weather:', error);
    return null;
  }
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Get match context data (injuries, weather, venue)
 * 
 * @param homeTeam - Home team name
 * @param awayTeam - Away team name
 * @param sport - Sport type (e.g., "soccer", "premier_league")
 * @param venueCity - Optional venue city for weather
 */
export async function getMatchContext(
  homeTeam: string,
  awayTeam: string,
  sport: string,
  venueCity?: string
): Promise<MatchContext> {
  const sportLower = sport.toLowerCase();
  const isSoccer = sportLower.includes('soccer') || 
                   sportLower.includes('football') ||
                   sportLower.includes('premier') ||
                   sportLower.includes('la_liga') ||
                   sportLower.includes('serie_a') ||
                   sportLower.includes('bundesliga') ||
                   sportLower.includes('ligue_1') ||
                   sportLower.includes('champions') ||
                   sportLower.includes('europa');
  
  const isIndoor = sportLower.includes('basketball') || 
                   sportLower.includes('hockey') || 
                   sportLower.includes('nba') || 
                   sportLower.includes('nhl');

  const results: MatchContext = {
    homeInjuries: null,
    awayInjuries: null,
    weather: null,
    venue: null,
    dataAvailable: false,
  };

  try {
    const promises: Promise<any>[] = [];

    // For soccer, try to fetch team info (ID + venue)
    let homeTeamInfo: TeamInfo | null = null;
    let awayTeamInfo: TeamInfo | null = null;
    
    if (isSoccer) {
      // Get team info (includes venue city for weather)
      [homeTeamInfo, awayTeamInfo] = await Promise.all([
        findTeamInfo(homeTeam),
        findTeamInfo(awayTeam),
      ]);
      
      // Fetch injuries if we have team IDs
      if (homeTeamInfo?.id) {
        promises.push(
          fetchSoccerInjuries(homeTeamInfo.id, homeTeam).then(r => {
            results.homeInjuries = r?.players || null;
          })
        );
      }
      
      if (awayTeamInfo?.id) {
        promises.push(
          fetchSoccerInjuries(awayTeamInfo.id, awayTeam).then(r => {
            results.awayInjuries = r?.players || null;
          })
        );
      }
      
      // Fetch weather using home team's venue city
      const weatherCity = venueCity || homeTeamInfo?.venueCity;
      if (weatherCity) {
        console.log(`[Weather] Fetching weather for ${weatherCity}`);
        promises.push(
          fetchWeather(weatherCity, false).then(r => { results.weather = r; })
        );
        
        // Set venue info
        if (homeTeamInfo?.venueName) {
          results.venue = {
            name: homeTeamInfo.venueName,
            city: homeTeamInfo.venueCity || weatherCity,
            capacity: 0,
            surface: 'grass',
            isNeutral: false,
          };
        }
      }
    } else if (!isIndoor && venueCity) {
      // Non-soccer outdoor sports with provided city
      promises.push(
        fetchWeather(venueCity, false).then(r => { results.weather = r; })
      );
    }

    await Promise.allSettled(promises);

    results.dataAvailable = !!(
      (results.homeInjuries && results.homeInjuries.length > 0) || 
      (results.awayInjuries && results.awayInjuries.length > 0) || 
      results.weather
    );
    
  } catch (error) {
    console.error('[MatchContext] Error:', error);
  }

  return results;
}

/**
 * Helper to find team ID and venue by name
 */
interface TeamInfo {
  id: number;
  venueCity: string | null;
  venueName: string | null;
}

// Team name mappings for API-Football
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  'brighton and hove albion': 'Brighton',
  'brighton & hove albion': 'Brighton',
  'wolverhampton wanderers': 'Wolves',
  'west ham united': 'West Ham',
  'tottenham hotspur': 'Tottenham',
  'newcastle united': 'Newcastle',
  'nottingham forest': 'Nottingham Forest',
  'afc bournemouth': 'Bournemouth',
  'leicester city': 'Leicester',
  'ipswich town': 'Ipswich',
  'inter milan': 'Inter',
  'paris saint-germain': 'Paris Saint Germain',
};

function normalizeTeamNameForSearch(name: string): string {
  const lower = name.toLowerCase().trim();
  if (TEAM_NAME_MAPPINGS[lower]) return TEAM_NAME_MAPPINGS[lower];
  if (name.includes(' and ') || name.includes(' & ')) {
    return name.split(/\s+and\s+|\s+&\s+/i)[0].trim();
  }
  return name;
}

async function findTeamInfo(teamName: string): Promise<TeamInfo | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;
  
  // Check cache first
  const cacheKey = `teaminfo:${teamName.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = await cacheGet<TeamInfo>(cacheKey);
  if (cached) return cached;
  
  // Normalize name for search
  const searchName = normalizeTeamNameForSearch(teamName);
  
  try {
    let response = await fetch(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(searchName)}`,
      {
        headers: { 'x-apisports-key': apiKey },
      }
    );
    
    if (!response.ok) return null;
    
    let data = await response.json();
    
    // If normalized search fails, try first word
    if (!data.response?.length && searchName !== teamName) {
      const firstWord = teamName.split(/\s+/)[0];
      if (firstWord.length > 3) {
        response = await fetch(
          `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(firstWord)}`,
          {
            headers: { 'x-apisports-key': apiKey },
          }
        );
        if (response.ok) {
          data = await response.json();
        }
      }
    }
    
    if (data.response && data.response.length > 0) {
      const team = data.response[0].team;
      const venue = data.response[0].venue;
      
      const teamInfo: TeamInfo = {
        id: team.id,
        venueCity: venue?.city || null,
        venueName: venue?.name || null,
      };
      
      await cacheSet(cacheKey, teamInfo, CACHE_TTL.TEAM_ID || 24 * 60 * 60);
      console.log(`[TeamInfo] Found ${teamName}: ID=${teamInfo.id}, City=${teamInfo.venueCity}`);
      return teamInfo;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Format match context for AI prompt
 */
export function formatMatchContextForPrompt(context: MatchContext, homeTeam: string, awayTeam: string): string {
  if (!context.dataAvailable) {
    return '';
  }

  const parts: string[] = ['### ADDITIONAL MATCH CONTEXT ###'];

  // Injuries
  if (context.homeInjuries && context.homeInjuries.length > 0) {
    parts.push(`\n**${homeTeam} - Injuries/Absences:**`);
    context.homeInjuries.forEach(p => {
      const emoji = p.type === 'suspension' ? '🟥' : p.type === 'doubtful' ? '⚠️' : '🏥';
      parts.push(`${emoji} ${p.name} (${p.position}) - ${p.reason}`);
    });
  }

  if (context.awayInjuries && context.awayInjuries.length > 0) {
    parts.push(`\n**${awayTeam} - Injuries/Absences:**`);
    context.awayInjuries.forEach(p => {
      const emoji = p.type === 'suspension' ? '🟥' : p.type === 'doubtful' ? '⚠️' : '🏥';
      parts.push(`${emoji} ${p.name} (${p.position}) - ${p.reason}`);
    });
  }

  // Weather
  if (context.weather && !context.weather.isIndoor) {
    parts.push(`\n**Weather Conditions:**`);
    parts.push(`${context.weather.icon} ${context.weather.description}`);
    parts.push(`Temperature: ${context.weather.temperature}°C (feels like ${context.weather.feelsLike}°C)`);
    parts.push(`Humidity: ${context.weather.humidity}%`);
    parts.push(`Wind: ${context.weather.windSpeed} km/h`);
    if (context.weather.precipitation > 0) {
      parts.push(`Precipitation: ${context.weather.precipitation}mm`);
    }
  }

  return parts.join('\n');
}
