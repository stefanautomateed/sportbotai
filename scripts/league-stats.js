/**
 * Fetch real league statistics from API-Football
 * Run: node scripts/league-stats.js
 */

const API_KEY = '5e73f01586e0b0d7a097aae7c0c3ef1e';
const BASE_URL = 'https://v3.football.api-sports.io';

const LEAGUES = [
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 78, name: 'Bundesliga' },
  { id: 135, name: 'Serie A' },
  { id: 61, name: 'Ligue 1' },
];

async function fetchLeagueStats(leagueId, leagueName) {
  const url = `${BASE_URL}/fixtures?league=${leagueId}&season=2025&status=FT`;
  
  const response = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY }
  });
  
  const data = await response.json();
  const fixtures = data.response || [];
  
  if (fixtures.length === 0) {
    console.log(`${leagueName}: No data`);
    return null;
  }
  
  let totalGoals = 0;
  let draws = 0;
  let homeWins = 0;
  let awayWins = 0;
  
  for (const match of fixtures) {
    const homeGoals = match.goals.home || 0;
    const awayGoals = match.goals.away || 0;
    
    totalGoals += homeGoals + awayGoals;
    
    if (homeGoals === awayGoals) draws++;
    else if (homeGoals > awayGoals) homeWins++;
    else awayWins++;
  }
  
  const games = fixtures.length;
  const stats = {
    league: leagueName,
    leagueId: leagueId,
    games,
    goalsPerGame: (totalGoals / games).toFixed(2),
    drawPercent: ((draws / games) * 100).toFixed(1),
    homeWinPercent: ((homeWins / games) * 100).toFixed(1),
    awayWinPercent: ((awayWins / games) * 100).toFixed(1),
  };
  
  console.log(`${leagueName}: ${games} games | Goals/game: ${stats.goalsPerGame} | Draw: ${stats.drawPercent}% | Home: ${stats.homeWinPercent}% | Away: ${stats.awayWinPercent}%`);
  
  return stats;
}

async function main() {
  console.log('\\n=== Real League Statistics (2025 Season) ===\\n');
  
  const allStats = [];
  
  for (const league of LEAGUES) {
    const stats = await fetchLeagueStats(league.id, league.name);
    if (stats) allStats.push(stats);
    
    // Rate limit - 10 requests/minute on free tier
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\\n=== Summary for Model Calibration ===\\n');
  console.log('LEAGUE_CALIBRATION = {');
  for (const s of allStats) {
    console.log(`  '${s.league.toLowerCase().replace(' ', '_')}': {`);
    console.log(`    goalsPerGame: ${s.goalsPerGame},`);
    console.log(`    drawRate: ${(parseFloat(s.drawPercent) / 100).toFixed(3)},`);
    console.log(`    homeWinRate: ${(parseFloat(s.homeWinPercent) / 100).toFixed(3)},`);
    console.log(`    awayWinRate: ${(parseFloat(s.awayWinPercent) / 100).toFixed(3)},`);
    console.log(`  },`);
  }
  console.log('};');
}

main().catch(console.error);
