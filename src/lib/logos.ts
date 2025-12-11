/**
 * Team & League Logo Utilities
 * 
 * Provides logo URLs for teams and leagues using multiple sources:
 * 1. ESPN public CDN (most reliable for major leagues)
 * 2. Transfermarkt CDN for soccer teams (official logos)
 * 3. Generated fallback avatars
 * 
 * Usage:
 * - getTeamLogo(teamName, sport, league) -> URL
 * - getLeagueLogo(leagueName, sport) -> URL
 */

// ============================================
// LOGO SOURCES & MAPPINGS
// ============================================

/**
 * ESPN Team ID mappings for major sports
 * ESPN URLs: https://a.espncdn.com/i/teamlogos/{sport}/500/{id}.png
 */
const ESPN_TEAM_IDS: Record<string, Record<string, string>> = {
  // NFL Teams
  nfl: {
    'Arizona Cardinals': 'ari',
    'Atlanta Falcons': 'atl',
    'Baltimore Ravens': 'bal',
    'Buffalo Bills': 'buf',
    'Carolina Panthers': 'car',
    'Chicago Bears': 'chi',
    'Cincinnati Bengals': 'cin',
    'Cleveland Browns': 'cle',
    'Dallas Cowboys': 'dal',
    'Denver Broncos': 'den',
    'Detroit Lions': 'det',
    'Green Bay Packers': 'gb',
    'Houston Texans': 'hou',
    'Indianapolis Colts': 'ind',
    'Jacksonville Jaguars': 'jax',
    'Kansas City Chiefs': 'kc',
    'Las Vegas Raiders': 'lv',
    'Los Angeles Chargers': 'lac',
    'Los Angeles Rams': 'lar',
    'Miami Dolphins': 'mia',
    'Minnesota Vikings': 'min',
    'New England Patriots': 'ne',
    'New Orleans Saints': 'no',
    'New York Giants': 'nyg',
    'New York Jets': 'nyj',
    'Philadelphia Eagles': 'phi',
    'Pittsburgh Steelers': 'pit',
    'San Francisco 49ers': 'sf',
    'Seattle Seahawks': 'sea',
    'Tampa Bay Buccaneers': 'tb',
    'Tennessee Titans': 'ten',
    'Washington Commanders': 'wsh',
  },
  // NBA Teams
  nba: {
    'Atlanta Hawks': 'atl',
    'Boston Celtics': 'bos',
    'Brooklyn Nets': 'bkn',
    'Charlotte Hornets': 'cha',
    'Chicago Bulls': 'chi',
    'Cleveland Cavaliers': 'cle',
    'Dallas Mavericks': 'dal',
    'Denver Nuggets': 'den',
    'Detroit Pistons': 'det',
    'Golden State Warriors': 'gs',
    'Houston Rockets': 'hou',
    'Indiana Pacers': 'ind',
    'LA Clippers': 'lac',
    'Los Angeles Clippers': 'lac',
    'Los Angeles Lakers': 'lal',
    'LA Lakers': 'lal',
    'Memphis Grizzlies': 'mem',
    'Miami Heat': 'mia',
    'Milwaukee Bucks': 'mil',
    'Minnesota Timberwolves': 'min',
    'New Orleans Pelicans': 'no',
    'New York Knicks': 'ny',
    'Oklahoma City Thunder': 'okc',
    'Orlando Magic': 'orl',
    'Philadelphia 76ers': 'phi',
    'Phoenix Suns': 'phx',
    'Portland Trail Blazers': 'por',
    'Sacramento Kings': 'sac',
    'San Antonio Spurs': 'sa',
    'Toronto Raptors': 'tor',
    'Utah Jazz': 'uta',
    'Washington Wizards': 'wsh',
  },
  // NHL Teams
  nhl: {
    'Anaheim Ducks': 'ana',
    'Arizona Coyotes': 'ari',
    'Boston Bruins': 'bos',
    'Buffalo Sabres': 'buf',
    'Calgary Flames': 'cgy',
    'Carolina Hurricanes': 'car',
    'Chicago Blackhawks': 'chi',
    'Colorado Avalanche': 'col',
    'Columbus Blue Jackets': 'cbj',
    'Dallas Stars': 'dal',
    'Detroit Red Wings': 'det',
    'Edmonton Oilers': 'edm',
    'Florida Panthers': 'fla',
    'Los Angeles Kings': 'la',
    'Minnesota Wild': 'min',
    'Montreal Canadiens': 'mtl',
    'Nashville Predators': 'nsh',
    'New Jersey Devils': 'nj',
    'New York Islanders': 'nyi',
    'New York Rangers': 'nyr',
    'Ottawa Senators': 'ott',
    'Philadelphia Flyers': 'phi',
    'Pittsburgh Penguins': 'pit',
    'San Jose Sharks': 'sj',
    'Seattle Kraken': 'sea',
    'St. Louis Blues': 'stl',
    'Tampa Bay Lightning': 'tb',
    'Toronto Maple Leafs': 'tor',
    'Vancouver Canucks': 'van',
    'Vegas Golden Knights': 'vgk',
    'Washington Capitals': 'wsh',
    'Winnipeg Jets': 'wpg',
  },
  // MLB Teams
  mlb: {
    'Arizona Diamondbacks': 'ari',
    'Atlanta Braves': 'atl',
    'Baltimore Orioles': 'bal',
    'Boston Red Sox': 'bos',
    'Chicago Cubs': 'chc',
    'Chicago White Sox': 'chw',
    'Cincinnati Reds': 'cin',
    'Cleveland Guardians': 'cle',
    'Colorado Rockies': 'col',
    'Detroit Tigers': 'det',
    'Houston Astros': 'hou',
    'Kansas City Royals': 'kc',
    'Los Angeles Angels': 'laa',
    'LA Angels': 'laa',
    'Los Angeles Dodgers': 'lad',
    'LA Dodgers': 'lad',
    'Miami Marlins': 'mia',
    'Milwaukee Brewers': 'mil',
    'Minnesota Twins': 'min',
    'New York Mets': 'nym',
    'NY Mets': 'nym',
    'New York Yankees': 'nyy',
    'NY Yankees': 'nyy',
    'Oakland Athletics': 'oak',
    'Philadelphia Phillies': 'phi',
    'Pittsburgh Pirates': 'pit',
    'San Diego Padres': 'sd',
    'San Francisco Giants': 'sf',
    'Seattle Mariners': 'sea',
    'St. Louis Cardinals': 'stl',
    'Tampa Bay Rays': 'tb',
    'Texas Rangers': 'tex',
    'Toronto Blue Jays': 'tor',
    'Washington Nationals': 'wsh',
  },
};

/**
 * Major soccer league team logo mappings
 * Using Transfermarkt/official CDN URLs for official logos
 */
const SOCCER_TEAM_LOGOS: Record<string, string> = {
  // Premier League
  'Arsenal': 'https://crests.football-data.org/57.png',
  'Aston Villa': 'https://crests.football-data.org/58.png',
  'Bournemouth': 'https://crests.football-data.org/1044.png',
  'AFC Bournemouth': 'https://crests.football-data.org/1044.png',
  'Brentford': 'https://crests.football-data.org/402.png',
  'Brighton': 'https://crests.football-data.org/397.png',
  'Brighton & Hove Albion': 'https://crests.football-data.org/397.png',
  'Brighton and Hove Albion': 'https://crests.football-data.org/397.png',
  'Chelsea': 'https://crests.football-data.org/61.png',
  'Crystal Palace': 'https://crests.football-data.org/354.png',
  'Everton': 'https://crests.football-data.org/62.png',
  'Fulham': 'https://crests.football-data.org/63.png',
  'Ipswich': 'https://crests.football-data.org/349.png',
  'Ipswich Town': 'https://crests.football-data.org/349.png',
  'Leicester': 'https://crests.football-data.org/338.png',
  'Leicester City': 'https://crests.football-data.org/338.png',
  'Liverpool': 'https://crests.football-data.org/64.png',
  'Manchester City': 'https://crests.football-data.org/65.png',
  'Man City': 'https://crests.football-data.org/65.png',
  'Manchester United': 'https://crests.football-data.org/66.png',
  'Man United': 'https://crests.football-data.org/66.png',
  'Man Utd': 'https://crests.football-data.org/66.png',
  'Newcastle': 'https://crests.football-data.org/67.png',
  'Newcastle United': 'https://crests.football-data.org/67.png',
  'Nottingham Forest': 'https://crests.football-data.org/351.png',
  "Nott'm Forest": 'https://crests.football-data.org/351.png',
  'Southampton': 'https://crests.football-data.org/340.png',
  'Tottenham': 'https://crests.football-data.org/73.png',
  'Tottenham Hotspur': 'https://crests.football-data.org/73.png',
  'Spurs': 'https://crests.football-data.org/73.png',
  'West Ham': 'https://crests.football-data.org/563.png',
  'West Ham United': 'https://crests.football-data.org/563.png',
  'Wolves': 'https://crests.football-data.org/76.png',
  'Wolverhampton': 'https://crests.football-data.org/76.png',
  'Wolverhampton Wanderers': 'https://crests.football-data.org/76.png',
  // La Liga
  'Real Madrid': 'https://crests.football-data.org/86.png',
  'Barcelona': 'https://crests.football-data.org/81.png',
  'FC Barcelona': 'https://crests.football-data.org/81.png',
  'Atletico Madrid': 'https://crests.football-data.org/78.png',
  'Atlético Madrid': 'https://crests.football-data.org/78.png',
  'Sevilla': 'https://crests.football-data.org/559.png',
  'Sevilla FC': 'https://crests.football-data.org/559.png',
  'Real Sociedad': 'https://crests.football-data.org/92.png',
  'Real Betis': 'https://crests.football-data.org/90.png',
  'Villarreal': 'https://crests.football-data.org/94.png',
  'Villarreal CF': 'https://crests.football-data.org/94.png',
  'Athletic Bilbao': 'https://crests.football-data.org/77.png',
  'Athletic Club': 'https://crests.football-data.org/77.png',
  'Valencia': 'https://crests.football-data.org/95.png',
  'Valencia CF': 'https://crests.football-data.org/95.png',
  // Serie A
  'Juventus': 'https://crests.football-data.org/109.png',
  'Inter': 'https://crests.football-data.org/108.png',
  'Inter Milan': 'https://crests.football-data.org/108.png',
  'FC Internazionale Milano': 'https://crests.football-data.org/108.png',
  'AC Milan': 'https://crests.football-data.org/98.png',
  'Milan': 'https://crests.football-data.org/98.png',
  'Napoli': 'https://crests.football-data.org/113.png',
  'SSC Napoli': 'https://crests.football-data.org/113.png',
  'Roma': 'https://crests.football-data.org/100.png',
  'AS Roma': 'https://crests.football-data.org/100.png',
  'Lazio': 'https://crests.football-data.org/110.png',
  'SS Lazio': 'https://crests.football-data.org/110.png',
  'Atalanta': 'https://crests.football-data.org/102.png',
  'Atalanta BC': 'https://crests.football-data.org/102.png',
  'Fiorentina': 'https://crests.football-data.org/99.png',
  'ACF Fiorentina': 'https://crests.football-data.org/99.png',
  // Bundesliga
  'Bayern Munich': 'https://crests.football-data.org/5.png',
  'Bayern': 'https://crests.football-data.org/5.png',
  'FC Bayern München': 'https://crests.football-data.org/5.png',
  'Borussia Dortmund': 'https://crests.football-data.org/4.png',
  'Dortmund': 'https://crests.football-data.org/4.png',
  'BVB': 'https://crests.football-data.org/4.png',
  'RB Leipzig': 'https://crests.football-data.org/721.png',
  'Bayer Leverkusen': 'https://crests.football-data.org/3.png',
  'Leverkusen': 'https://crests.football-data.org/3.png',
  'Eintracht Frankfurt': 'https://crests.football-data.org/19.png',
  'Frankfurt': 'https://crests.football-data.org/19.png',
  'Wolfsburg': 'https://crests.football-data.org/11.png',
  'VfL Wolfsburg': 'https://crests.football-data.org/11.png',
  // Ligue 1
  'Paris Saint-Germain': 'https://crests.football-data.org/524.png',
  'PSG': 'https://crests.football-data.org/524.png',
  'Marseille': 'https://crests.football-data.org/516.png',
  'Olympique Marseille': 'https://crests.football-data.org/516.png',
  'OM': 'https://crests.football-data.org/516.png',
  'Lyon': 'https://crests.football-data.org/523.png',
  'Olympique Lyon': 'https://crests.football-data.org/523.png',
  'OL': 'https://crests.football-data.org/523.png',
  'Monaco': 'https://crests.football-data.org/548.png',
  'AS Monaco': 'https://crests.football-data.org/548.png',
  'Lille': 'https://crests.football-data.org/521.png',
  'LOSC Lille': 'https://crests.football-data.org/521.png',
};

/**
 * League logo mappings - using official/reliable CDN sources
 * Mapped by sport_key from The Odds API and common display names
 */
const LEAGUE_LOGOS: Record<string, string> = {
  // ============================================
  // US SPORTS (ESPN CDN - official)
  // ============================================
  
  // NFL
  'NFL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'americanfootball_nfl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  
  // NCAA Football
  'NCAA Football': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'NCAAF': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'americanfootball_ncaaf': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  
  // NBA
  'NBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'basketball_nba': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  
  // NCAA Basketball
  'NCAA Basketball': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'NCAAB': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  'basketball_ncaab': 'https://a.espncdn.com/i/teamlogos/ncaa/500/ncaa.png',
  
  // NHL
  'NHL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'icehockey_nhl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  
  // MLB
  'MLB': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'baseball_mlb': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  
  // MLS
  'MLS': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  'soccer_usa_mls': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  
  // ============================================
  // SOCCER/FOOTBALL (football-data.org CDN - official)
  // ============================================
  
  // Premier League
  'Premier League': 'https://crests.football-data.org/PL.png',
  'EPL': 'https://crests.football-data.org/PL.png',
  'English Premier League': 'https://crests.football-data.org/PL.png',
  'soccer_epl': 'https://crests.football-data.org/PL.png',
  
  // La Liga
  'La Liga': 'https://crests.football-data.org/PD.png',
  'LaLiga': 'https://crests.football-data.org/PD.png',
  'soccer_spain_la_liga': 'https://crests.football-data.org/PD.png',
  
  // Serie A
  'Serie A': 'https://crests.football-data.org/SA.png',
  'soccer_italy_serie_a': 'https://crests.football-data.org/SA.png',
  
  // Bundesliga
  'Bundesliga': 'https://crests.football-data.org/BL1.png',
  'soccer_germany_bundesliga': 'https://crests.football-data.org/BL1.png',
  
  // Ligue 1
  'Ligue 1': 'https://crests.football-data.org/FL1.png',
  'soccer_france_ligue_one': 'https://crests.football-data.org/FL1.png',
  
  // UEFA Champions League
  'Champions League': 'https://crests.football-data.org/CL.png',
  'UEFA Champions League': 'https://crests.football-data.org/CL.png',
  'soccer_uefa_champs_league': 'https://crests.football-data.org/CL.png',
  
  // UEFA Europa League
  'Europa League': 'https://crests.football-data.org/EL.png',
  'UEFA Europa League': 'https://crests.football-data.org/EL.png',
  'soccer_uefa_europa_league': 'https://crests.football-data.org/EL.png',
  
  // English Cups
  'FA Cup': 'https://crests.football-data.org/FAC.png',
  'EFL Cup': 'https://crests.football-data.org/ELC.png',
  'Carabao Cup': 'https://crests.football-data.org/ELC.png',
  'League Cup': 'https://crests.football-data.org/ELC.png',
  'Championship': 'https://crests.football-data.org/ELC.png',
  'EFL Championship': 'https://crests.football-data.org/ELC.png',
  
  // ============================================
  // BASKETBALL - EUROPE
  // ============================================
  
  // EuroLeague
  'EuroLeague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  'Euroleague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  'basketball_euroleague': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/Euroleague_Basketball_logo.svg/200px-Euroleague_Basketball_logo.svg.png',
  
  // ============================================
  // TENNIS (Grand Slams)
  // ============================================
  
  'ATP': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/ATP_Tour_logo.svg/200px-ATP_Tour_logo.svg.png',
  'WTA': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/WTA_logo_2010.svg/200px-WTA_logo_2010.svg.png',
  'Australian Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'ATP Australian Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'tennis_atp_aus_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Australian_Open_Logo_2017.svg/200px-Australian_Open_Logo_2017.svg.png',
  'French Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'Roland Garros': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'ATP French Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'tennis_atp_french_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Logo_Roland-Garros.svg/200px-Logo_Roland-Garros.svg.png',
  'Wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'ATP Wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'tennis_atp_wimbledon': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Wimbledon.svg/200px-Wimbledon.svg.png',
  'US Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  'ATP US Open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  'tennis_atp_us_open': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/US_Open_%28tennis%29_logo.svg/200px-US_Open_%28tennis%29_logo.svg.png',
  
  // ============================================
  // MMA/UFC
  // ============================================
  
  'UFC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'MMA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'UFC/MMA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  'mma_mixed_martial_arts': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UFC_Logo.svg/200px-UFC_Logo.svg.png',
  
  // ============================================
  // GOLF
  // ============================================
  
  'PGA': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'PGA Tour': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'golf_pga': 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/PGA_Tour_logo.svg/200px-PGA_Tour_logo.svg.png',
  'Masters': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Masters_Tournament_logo.svg/200px-Masters_Tournament_logo.svg.png',
  'The Masters': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Masters_Tournament_logo.svg/200px-Masters_Tournament_logo.svg.png',
  
  // ============================================
  // RUGBY
  // ============================================
  
  'Six Nations': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Six_Nations_Championship_logo.svg/200px-Six_Nations_Championship_logo.svg.png',
  'rugby_union_six_nations': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Six_Nations_Championship_logo.svg/200px-Six_Nations_Championship_logo.svg.png',
  
  // ============================================
  // CRICKET
  // ============================================
  
  'IPL': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  'Indian Premier League': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  'cricket_ipl': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/200px-Indian_Premier_League_Official_Logo.svg.png',
  
  // ============================================
  // AUSTRALIAN RULES
  // ============================================
  
  'AFL': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/AFL_logo.svg/200px-AFL_logo.svg.png',
  'aussierules_afl': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/AFL_logo.svg/200px-AFL_logo.svg.png',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize sport name to lowercase key
 */
function normalizeSport(sport: string): string {
  const sportLower = sport.toLowerCase();
  
  // Soccer/Football
  if (sportLower.includes('football') && !sportLower.includes('american')) return 'soccer';
  if (sportLower.includes('soccer') || sportLower.includes('epl') || sportLower.includes('premier')) return 'soccer';
  if (sportLower.includes('la_liga') || sportLower.includes('serie_a') || sportLower.includes('bundesliga')) return 'soccer';
  if (sportLower.includes('ligue') || sportLower.includes('champs_league') || sportLower.includes('europa')) return 'soccer';
  
  // Basketball
  if (sportLower.includes('basketball') || sportLower === 'nba' || sportLower.includes('euroleague')) return 'nba';
  if (sportLower.includes('ncaab')) return 'nba';
  
  // Hockey
  if (sportLower.includes('hockey') || sportLower === 'nhl' || sportLower.includes('icehockey')) return 'nhl';
  
  // American Football
  if (sportLower.includes('american') || sportLower === 'nfl' || sportLower.includes('ncaaf')) return 'nfl';
  
  // Baseball
  if (sportLower.includes('baseball') || sportLower === 'mlb') return 'mlb';
  
  // MMA/UFC
  if (sportLower.includes('mma') || sportLower.includes('ufc')) return 'mma';
  
  // Tennis
  if (sportLower.includes('tennis') || sportLower.includes('atp') || sportLower.includes('wta')) return 'tennis';
  
  // Golf
  if (sportLower.includes('golf') || sportLower.includes('pga')) return 'golf';
  
  return sportLower;
}

/**
 * Generate a consistent color from team name
 */
function getTeamColor(teamName: string): string {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
}

/**
 * Get team initials (up to 3 chars)
 */
function getTeamInitials(teamName: string): string {
  const words = teamName.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

/**
 * Generate SVG data URL for fallback avatar
 */
function generateFallbackLogo(name: string, type: 'team' | 'league' = 'team'): string {
  const initials = getTeamInitials(name);
  const color = getTeamColor(name);
  const bgColor = type === 'league' ? '#1a1a2e' : color;
  const textColor = type === 'league' ? color : '#ffffff';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="12" fill="${bgColor}"/>
      <text x="50" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get team logo URL
 * 
 * @param teamName - Full team name (e.g., "Los Angeles Lakers")
 * @param sport - Sport type (e.g., "nba", "soccer", "nfl")
 * @param league - Optional league name for more specific matching
 * @returns Logo URL (ESPN, API-Sports, or fallback SVG)
 */
export function getTeamLogo(teamName: string, sport: string, league?: string): string {
  const normalizedSport = normalizeSport(sport);
  
  // Try ESPN for US sports (NBA, NFL, NHL, MLB)
  if (['nba', 'nfl', 'nhl', 'mlb'].includes(normalizedSport)) {
    const espnIds = ESPN_TEAM_IDS[normalizedSport];
    if (espnIds) {
      // Try exact match first
      if (espnIds[teamName]) {
        return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[teamName]}.png`;
      }
      // Try partial match
      const teamKey = Object.keys(espnIds).find(key => 
        key.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(key.toLowerCase())
      );
      if (teamKey) {
        return `https://a.espncdn.com/i/teamlogos/${normalizedSport}/500/${espnIds[teamKey]}.png`;
      }
    }
  }
  
  // Try football-data.org for soccer (official logos, no auth required)
  if (normalizedSport === 'soccer') {
    // Try exact match
    if (SOCCER_TEAM_LOGOS[teamName]) {
      return SOCCER_TEAM_LOGOS[teamName];
    }
    // Try case-insensitive exact match
    const exactKey = Object.keys(SOCCER_TEAM_LOGOS).find(key => 
      key.toLowerCase() === teamName.toLowerCase()
    );
    if (exactKey) {
      return SOCCER_TEAM_LOGOS[exactKey];
    }
    // Try partial match
    const teamKey = Object.keys(SOCCER_TEAM_LOGOS).find(key => 
      key.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(key.toLowerCase())
    );
    if (teamKey) {
      return SOCCER_TEAM_LOGOS[teamKey];
    }
  }
  
  // Fallback to generated avatar
  return generateFallbackLogo(teamName, 'team');
}

/**
 * Get league logo URL
 * 
 * @param leagueName - League name (e.g., "Premier League", "NBA")
 * @param sport - Sport type for better matching
 * @returns Logo URL or fallback SVG
 */
export function getLeagueLogo(leagueName: string, sport?: string): string {
  // Try exact match
  if (LEAGUE_LOGOS[leagueName]) {
    return LEAGUE_LOGOS[leagueName];
  }
  
  // Try partial match
  const leagueKey = Object.keys(LEAGUE_LOGOS).find(key => 
    key.toLowerCase().includes(leagueName.toLowerCase()) ||
    leagueName.toLowerCase().includes(key.toLowerCase())
  );
  if (leagueKey) {
    return LEAGUE_LOGOS[leagueKey];
  }
  
  // Check sport for default league logo
  const normalizedSport = sport ? normalizeSport(sport) : '';
  if (normalizedSport === 'nba') return LEAGUE_LOGOS['NBA'];
  if (normalizedSport === 'nfl') return LEAGUE_LOGOS['NFL'];
  if (normalizedSport === 'nhl') return LEAGUE_LOGOS['NHL'];
  
  // Fallback
  return generateFallbackLogo(leagueName, 'league');
}

/**
 * Logo component props helper
 * Returns props object ready for Next.js Image or img tag
 */
export function getLogoProps(
  name: string, 
  type: 'team' | 'league',
  sport: string,
  league?: string
): { src: string; alt: string; fallback: string } {
  const src = type === 'team' 
    ? getTeamLogo(name, sport, league)
    : getLeagueLogo(name, sport);
  
  return {
    src,
    alt: `${name} logo`,
    fallback: generateFallbackLogo(name, type),
  };
}
