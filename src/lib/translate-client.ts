/**
 * Client-side translation utilities
 * 
 * Lightweight translations for match data without server calls
 */

// Team name mappings (common teams - Serbian Latin script)
export const TEAM_TRANSLATIONS: Record<string, string> = {
  // English Premier League
  'Manchester United': 'Mančester Junajted',
  'Manchester City': 'Mančester Siti',
  'Liverpool': 'Liverpul',
  'Chelsea': 'Čelsi',
  'Arsenal': 'Arsenal',
  'Tottenham Hotspur': 'Totenhem',
  'Tottenham': 'Totenhem',
  'Newcastle United': 'Njukasl Junajted',
  'Newcastle': 'Njukasl',
  'Brighton': 'Brajton',
  'West Ham United': 'Vest Hem',
  'West Ham': 'Vest Hem',
  'Aston Villa': 'Aston Vila',
  'Leicester City': 'Lester Siti',
  'Everton': 'Everton',
  'Leeds United': 'Lids Junajted',
  'Wolves': 'Volvsi',
  'Wolverhampton': 'Volverhempton',
  'Crystal Palace': 'Kristal Palas',
  'Brentford': 'Brentford',
  'Fulham': 'Fulam',
  'Southampton': 'Sautempton',
  
  // La Liga
  'Real Madrid': 'Real Madrid',
  'Barcelona': 'Barselona',
  'Atletico Madrid': 'Atletiko Madrid',
  'Sevilla': 'Sevilja',
  'Valencia': 'Valensija',
  'Villarreal': 'Vijareal',
  'Real Sociedad': 'Real Sosijedad',
  'Real Betis': 'Real Betis',
  'Athletic Bilbao': 'Atletik Bilbao',
  
  // Serie A
  'Juventus': 'Juventus',
  'Inter Milan': 'Inter',
  'Inter': 'Inter',
  'AC Milan': 'Milan',
  'Milan': 'Milan',
  'Napoli': 'Napoli',
  'Roma': 'Roma',
  'Lazio': 'Lacio',
  'Atalanta': 'Atalanta',
  'Fiorentina': 'Fjorentina',
  
  // Bundesliga
  'Bayern Munich': 'Bajern Minhen',
  'Bayern München': 'Bajern Minhen',
  'Borussia Dortmund': 'Borusija Dortmund',
  'RB Leipzig': 'RB Lajpcig',
  'Bayer Leverkusen': 'Bajer Leverkuzen',
  'Union Berlin': 'Union Berlin',
  
  // Ligue 1
  'Paris Saint-Germain': 'Pari Sen Žermen',
  'PSG': 'PSG',
  'Marseille': 'Marsej',
  'Lyon': 'Lion',
  'Monaco': 'Monako',
  'Lille': 'Lil',
  
  // NBA
  'Los Angeles Lakers': 'Los Anđeles Lejkersi',
  'Boston Celtics': 'Boston Seltiksi',
  'Golden State Warriors': 'Golden Stejt Voriorsi',
  'Miami Heat': 'Majami Hit',
  'Chicago Bulls': 'Čikago Bulsi',
  'Brooklyn Nets': 'Bruklin Netsi',
  'Philadelphia 76ers': 'Filadelfija 76ersi',
  'Milwaukee Bucks': 'Milvoki Baksi',
  
  // NFL
  'Kansas City Chiefs': 'Kanzas Siti Čifsi',
  'San Francisco 49ers': 'San Francisko 49ersi',
  'Dallas Cowboys': 'Dalas Kaubojsi',
  'New England Patriots': 'Nju Inglend Pejtriotsi',
  'Green Bay Packers': 'Grin Bej Pakersi',
};

// League name mappings
export const LEAGUE_TRANSLATIONS: Record<string, string> = {
  'Premier League': 'Premijer Liga',
  'English Premier League': 'Engleska Premijer Liga',
  'EPL': 'EPL',
  'La Liga': 'La Liga',
  'Serie A': 'Serija A',
  'Bundesliga': 'Bundesliga',
  'Ligue 1': 'Liga 1',
  'Champions League': 'Liga Šampiona',
  'UEFA Champions League': 'UEFA Liga Šampiona',
  'Europa League': 'Evropska Liga',
  'Europa Conference League': 'Konferencijska Liga',
  'FA Cup': 'FA Kup',
  'Carabao Cup': 'Karabao Kup',
  'Copa del Rey': 'Kup Kralja',
  'Coppa Italia': 'Kup Italije',
  'DFB-Pokal': 'DFB Kup',
  'NBA': 'NBA',
  'NFL': 'NFL',
  'NHL': 'NHL',
  'UFC': 'UFC',
  'MMA': 'MMA',
};

// Common sports phrases
export const PHRASE_TRANSLATIONS: Record<string, string> = {
  // Match terms
  'vs': 'protiv',
  'vs.': 'protiv',
  'versus': 'protiv',
  'Home': 'Domaćin',
  'Away': 'Gost',
  'Draw': 'Nerešeno',
  'Win': 'Pobeda',
  'Loss': 'Poraz',
  'Tie': 'Remi',
  
  // Scoring
  'Goal': 'Gol',
  'Goals': 'Golova',
  'Point': 'Poen',
  'Points': 'Poena',
  'Score': 'Rezultat',
  'Final Score': 'Konačan Rezultat',
  
  // Player stats
  'Assist': 'Asistencija',
  'Assists': 'Asistencija',
  'Yellow Card': 'Žuti Karton',
  'Red Card': 'Crveni Karton',
  'Substitution': 'Izmena',
  'Captain': 'Kapiten',
  
  // Player status
  'Injury': 'Povreda',
  'Injured': 'Povređen',
  'Suspended': 'Suspendovan',
  'Available': 'Dostupan',
  'Doubtful': 'Nesiguran',
  'Out': 'Van',
  'Fitness': 'Kondicija',
  
  // Form & Stats
  'Form': 'Forma',
  'Last 5': 'Poslednjih 5',
  'Last 10': 'Poslednjih 10',
  'Home Form': 'Forma kod Kuće',
  'Away Form': 'Forma u Gostima',
  'Recent Form': 'Nedavna Forma',
  'Current Form': 'Trenutna Forma',
  
  // Head to Head
  'Head to Head': 'Međusobni Dueli',
  'H2H': 'H2H',
  'Previous Meetings': 'Prethodni Susreti',
  'History': 'Istorija',
  
  // General
  'Statistics': 'Statistika',
  'Stats': 'Statistika',
  'Odds': 'Kvote',
  'Prediction': 'Predikcija',
  'Analysis': 'Analiza',
  'Preview': 'Pregled',
  'Review': 'Recenzija',
  'Summary': 'Rezime',
  'Highlights': 'Vrhunci',
  
  // Team info
  'Key Players': 'Ključni Igrači',
  'Star Player': 'Zvezdani Igrač',
  'Team News': 'Vesti o Timu',
  'Lineup': 'Postava',
  'Formation': 'Formacija',
  'Squad': 'Tim',
  'Roster': 'Spisak',
  'Manager': 'Menadžer',
  'Coach': 'Trener',
  
  // Time
  'Upcoming': 'Predstojeći',
  'Today': 'Danas',
  'Tomorrow': 'Sutra',
  'This Week': 'Ove Nedelje',
  'Next Week': 'Sledeće Nedelje',
  'Live': 'Uživo',
  'Scheduled': 'Zakazano',
  'Finished': 'Završeno',
  'Postponed': 'Odloženo',
  'Cancelled': 'Otkazano',
  
  // Betting
  'Value': 'Vrednost',
  'Risk': 'Rizik',
  'Confidence': 'Pouzdanost',
  'Probability': 'Verovatnoća',
  'Expected': 'Očekivano',
};

/**
 * Translate team name to Serbian (if mapping exists)
 */
export function translateTeam(team: string, locale: string = 'en'): string {
  if (locale !== 'sr' || !team) return team;
  return TEAM_TRANSLATIONS[team] || team;
}

/**
 * Translate league name to Serbian
 */
export function translateLeague(league: string, locale: string = 'en'): string {
  if (locale !== 'sr' || !league) return league;
  return LEAGUE_TRANSLATIONS[league] || league;
}

/**
 * Translate common phrase
 */
export function translatePhrase(phrase: string, locale: string = 'en'): string {
  if (locale !== 'sr' || !phrase) return phrase;
  return PHRASE_TRANSLATIONS[phrase] || phrase;
}

/**
 * Translate multiple phrases in a text string
 */
export function translatePhrases(text: string, locale: string = 'en'): string {
  if (locale !== 'sr' || !text) return text;
  
  let translated = text;
  
  // Sort by length (longest first) to avoid partial matches
  const sorted = Object.entries(PHRASE_TRANSLATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );
  
  sorted.forEach(([en, sr]) => {
    // Word boundary regex for whole word matching
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, sr);
  });
  
  return translated;
}

/**
 * Translate match data structure
 */
export interface MatchData {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  status?: string;
  [key: string]: any;
}

export function translateMatchData(match: MatchData, locale: string = 'en'): MatchData {
  if (locale !== 'sr') return match;

  return {
    ...match,
    homeTeam: translateTeam(match.homeTeam, locale),
    awayTeam: translateTeam(match.awayTeam, locale),
    league: match.league ? translateLeague(match.league, locale) : match.league,
    status: match.status ? translatePhrase(match.status, locale) : match.status,
  };
}

/**
 * Check if text needs AI translation
 * Returns true for long-form content that can't be handled by simple mappings
 */
export function needsAITranslation(text: string): boolean {
  // If text is > 100 chars and contains multiple sentences, likely needs AI
  return text.length > 100 && text.split(/[.!?]/).length > 2;
}
