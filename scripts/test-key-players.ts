/**
 * Test script to verify key player lookup for all mapped teams
 * Run with: npx ts-node scripts/test-key-players.ts
 */

// Test matchups - real team pairs
const TEST_MATCHUPS = [
  // Premier League
  { home: 'Arsenal', away: 'Chelsea', homeId: 42, awayId: 49, league: 'Premier League' },
  { home: 'Liverpool', away: 'Manchester City', homeId: 40, awayId: 50, league: 'Premier League' },
  { home: 'Manchester United', away: 'Tottenham', homeId: 33, awayId: 47, league: 'Premier League' },
  { home: 'Newcastle', away: 'Aston Villa', homeId: 34, awayId: 66, league: 'Premier League' },
  { home: 'West Ham', away: 'Everton', homeId: 48, awayId: 45, league: 'Premier League' },
  // La Liga
  { home: 'Real Madrid', away: 'Barcelona', homeId: 541, awayId: 529, league: 'La Liga' },
  { home: 'Atletico Madrid', away: 'Sevilla', homeId: 530, awayId: 536, league: 'La Liga' },
  // Serie A
  { home: 'Juventus', away: 'Inter Milan', homeId: 496, awayId: 505, league: 'Serie A' },
  { home: 'AC Milan', away: 'Napoli', homeId: 489, awayId: 492, league: 'Serie A' },
  // Bundesliga
  { home: 'Bayern Munich', away: 'Borussia Dortmund', homeId: 157, awayId: 165, league: 'Bundesliga' },
  { home: 'RB Leipzig', away: 'Bayer Leverkusen', homeId: 173, awayId: 168, league: 'Bundesliga' },
  // Ligue 1
  { home: 'PSG', away: 'Marseille', homeId: 85, awayId: 81, league: 'Ligue 1' },
  { home: 'Lyon', away: 'Monaco', homeId: 80, awayId: 91, league: 'Ligue 1' },
];

// Known player mappings for validation (these are current top scorers as of 2024/25)
const KNOWN_PLAYERS: Record<number, string[]> = {
  // Premier League
  42: ['Saka', 'Havertz', 'Martinelli', 'Trossard', 'Jesus'], // Arsenal
  49: ['Palmer', 'Jackson', 'Neto', 'Nkunku', 'Madueke'], // Chelsea
  40: ['Salah', 'Gakpo', 'Diaz', 'Jota', 'Nunez'], // Liverpool
  50: ['Haaland', 'Foden', 'Grealish', 'Alvarez', 'De Bruyne'], // Man City
  33: ['Hojlund', 'Rashford', 'Fernandes', 'Garnacho', 'Zirkzee'], // Man Utd
  47: ['Son', 'Solanke', 'Johnson', 'Kulusevski', 'Richarlison'], // Tottenham
  34: ['Isak', 'Gordon', 'Barnes', 'Joelinton', 'Wilson'], // Newcastle
  66: ['Watkins', 'Rogers', 'Duran', 'McGinn', 'Tielemans'], // Aston Villa
  48: ['Bowen', 'Antonio', 'Kudus', 'Paqueta', 'Summerville'], // West Ham
  45: ['Calvert-Lewin', 'McNeil', 'Ndiaye', 'Doucoure', 'Harrison'], // Everton
  // La Liga
  541: ['Mbappe', 'Vinicius', 'Bellingham', 'Rodrygo', 'Endrick'], // Real Madrid
  529: ['Lewandowski', 'Raphinha', 'Yamal', 'Pedri', 'Ferran'], // Barcelona
  530: ['Griezmann', 'Alvarez', 'Sorloth', 'Sørloth', 'Correa', 'Morata'], // Atletico
  536: ['Lukebakio', 'Isaac', 'En-Nesyri', 'Ocampos', 'Suso'], // Sevilla
  // Serie A
  496: ['Vlahovic', 'Yildiz', 'Koopmeiners', 'Conceicao', 'Weah'], // Juventus
  505: ['Lautaro', 'Thuram', 'Taremi', 'Arnautovic', 'Correa'], // Inter
  489: ['Morata', 'Pulisic', 'Leao', 'Abraham', 'Okafor'], // AC Milan
  492: ['Lukaku', 'Kvaratskhelia', 'Politano', 'Raspadori', 'Simeone'], // Napoli
  // Bundesliga
  157: ['Kane', 'Musiala', 'Sane', 'Gnabry', 'Muller'], // Bayern
  165: ['Guirassy', 'Adeyemi', 'Brandt', 'Malen', 'Beier'], // Dortmund
  173: ['Openda', 'Sesko', 'Nusa', 'Xavi', 'Silva'], // Leipzig
  168: ['Wirtz', 'Boniface', 'Schick', 'Tella', 'Frimpong'], // Leverkusen
  // Ligue 1
  85: ['Dembele', 'Barcola', 'Asensio', 'Kolo Muani', 'Ramos'], // PSG
  81: ['Greenwood', 'Wahi', 'Maupay', 'Rabiot', 'Rongier'], // Marseille
  80: ['Lacazette', 'Cherki', 'Fofana', 'Mikautadze', 'Benrahma'], // Lyon
  91: ['Embolo', 'Ben Seghir', 'Minamino', 'Golovin', 'Akliouche'], // Monaco
};

// Normalize string by removing accents
function normalizeString(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function testKeyPlayers() {
  console.log('🔍 Testing Key Player Lookup for All Teams\n');
  console.log('='.repeat(70));
  
  const results: { matchup: string; homePlayer: string; awayPlayer: string; homeValid: boolean; awayValid: boolean }[] = [];
  
  for (const matchup of TEST_MATCHUPS) {
    // Create a test match ID
    const matchInfo = {
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      league: matchup.league,
      venue: 'Test Stadium',
      date: new Date().toISOString(),
      homeOdds: 1.5,
      drawOdds: 4.0,
      awayOdds: 6.0,
    };
    
    const matchId = Buffer.from(JSON.stringify(matchInfo)).toString('base64');
    
    try {
      console.log(`\n⏳ Testing: ${matchup.home} vs ${matchup.away}...`);
      const response = await fetch(`https://betsense-ai.vercel.app/api/match-preview/${matchId}`);
      const data = await response.json();
      
      const homePlayer = data.keyPlayerBattle?.homePlayer;
      const awayPlayer = data.keyPlayerBattle?.awayPlayer;
      
      // Check if players are from the correct team by validating known players
      const knownHomePlayers = KNOWN_PLAYERS[matchup.homeId] || [];
      const knownAwayPlayers = KNOWN_PLAYERS[matchup.awayId] || [];
      
      const homeValid = !homePlayer || knownHomePlayers.length === 0 || knownHomePlayers.some(known => {
        const normalizedKnown = normalizeString(known);
        const normalizedName = normalizeString(homePlayer.name || '');
        const lastName = normalizedName.split(' ').pop() || '';
        return normalizedName.includes(normalizedKnown) || normalizedKnown.includes(lastName);
      });
      
      const awayValid = !awayPlayer || knownAwayPlayers.length === 0 || knownAwayPlayers.some(known => {
        const normalizedKnown = normalizeString(known);
        const normalizedName = normalizeString(awayPlayer.name || '');
        const lastName = normalizedName.split(' ').pop() || '';
        return normalizedName.includes(normalizedKnown) || normalizedKnown.includes(lastName);
      });
      
      results.push({
        matchup: `${matchup.home} vs ${matchup.away}`,
        homePlayer: homePlayer ? `${homePlayer.name} (${homePlayer.goals}G)` : 'N/A',
        awayPlayer: awayPlayer ? `${awayPlayer.name} (${awayPlayer.goals}G)` : 'N/A',
        homeValid,
        awayValid,
      });
      
      // Add delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.push({
        matchup: `${matchup.home} vs ${matchup.away}`,
        homePlayer: 'ERROR',
        awayPlayer: 'ERROR',
        homeValid: false,
        awayValid: false,
      });
    }
  }
  
  // Print results
  console.log('\n\n📊 Final Results:\n');
  console.log('='.repeat(70));
  
  let passCount = 0;
  let failCount = 0;
  
  for (const result of results) {
    const homeStatus = result.homeValid ? '✅' : '❌';
    const awayStatus = result.awayValid ? '✅' : '❌';
    
    if (result.homeValid) passCount++;
    else failCount++;
    if (result.awayValid) passCount++;
    else failCount++;
    
    console.log(`\n${result.matchup}`);
    console.log(`  ${homeStatus} Home: ${result.homePlayer}`);
    console.log(`  ${awayStatus} Away: ${result.awayPlayer}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed out of ${results.length * 2} teams`);
}

testKeyPlayers().catch(console.error);
