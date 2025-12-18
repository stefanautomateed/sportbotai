const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Real game results from ESPN/NBA.com/NHL.com - December 17, 2025
const REAL_RESULTS = [
  // NBA - Dec 17, 2025
  {
    matchRef: 'Chicago Bulls vs Cleveland Cavaliers',
    actualScore: '127-111',  // Bulls 127, Cavaliers 111
    actualResult: 'Home win',  // Bulls (home) won
  },
  {
    matchRef: 'Minnesota Timberwolves vs Memphis Grizzlies',
    actualScore: '110-116',  // Timberwolves 110, Grizzlies 116
    actualResult: 'Away win',  // Grizzlies (away) won
  },
  
  // NHL - Dec 17, 2025
  {
    matchRef: 'Florida Panthers vs Los Angeles Kings',
    actualScore: '3-2',  // Panthers 3, Kings 2
    actualResult: 'Home win',  // Panthers (home) won
  },
  {
    matchRef: 'Detroit Red Wings vs Utah Mammoth',
    actualScore: '1-4',  // Red Wings 1, Mammoth 4
    actualResult: 'Away win',  // Utah Mammoth (away) won
  },
  {
    matchRef: 'Nashville Predators vs Carolina Hurricanes',
    actualScore: '1-4',  // Predators 1, Hurricanes 4
    actualResult: 'Away win',  // Hurricanes (away) won
  },
  {
    matchRef: 'Vegas Golden Knights vs New Jersey Devils',
    actualScore: '1-2',  // Golden Knights 1, Devils 2 (SO)
    actualResult: 'Away win',  // Devils (away) won
  },
];

async function updatePredictions() {
  console.log('Updating predictions with real results from ESPN...\n');
  
  let updated = 0;
  let correct = 0;
  let incorrect = 0;
  
  for (const result of REAL_RESULTS) {
    // Find matching prediction
    const prediction = await prisma.predictionOutcome.findFirst({
      where: {
        matchRef: result.matchRef,
        wasAccurate: null,  // Only pending ones
      }
    });
    
    if (prediction) {
      // Check if prediction was correct
      const predictedOutcome = prediction.predictedScenario?.toLowerCase() || '';
      const actualOutcome = result.actualResult.toLowerCase();
      
      let wasAccurate = false;
      
      // Match prediction to result
      if (predictedOutcome.includes('home') && actualOutcome.includes('home')) {
        wasAccurate = true;
      } else if (predictedOutcome.includes('away') && actualOutcome.includes('away')) {
        wasAccurate = true;
      } else if (predictedOutcome.includes('draw') && actualOutcome.includes('draw')) {
        wasAccurate = true;
      } else if (prediction.predictedScenario && prediction.predictedScenario.includes('win')) {
        // Check if team name matches - e.g. "Detroit Red Wings win"
        const predictedTeam = prediction.predictedScenario.replace(' win', '').toLowerCase();
        const [homeTeam, awayTeam] = result.matchRef.split(' vs ').map(t => t.toLowerCase());
        
        if (actualOutcome.includes('home') && predictedTeam.includes(homeTeam.split(' ')[0])) {
          wasAccurate = true;
        } else if (actualOutcome.includes('away') && predictedTeam.includes(awayTeam.split(' ')[0])) {
          wasAccurate = true;
        }
      }
      
      // Update the prediction
      await prisma.predictionOutcome.update({
        where: { id: prediction.id },
        data: {
          actualResult: result.actualResult,
          actualScore: result.actualScore,
          wasAccurate: wasAccurate,
          learningNote: wasAccurate ? 'Prediction was correct!' : 'Prediction was incorrect'
        }
      });
      
      updated++;
      if (wasAccurate) correct++;
      else incorrect++;
      
      console.log(`✅ ${result.matchRef}`);
      console.log(`   Predicted: ${prediction.predictedScenario}`);
      console.log(`   Actual: ${result.actualResult} (${result.actualScore})`);
      console.log(`   Result: ${wasAccurate ? '🎯 CORRECT' : '❌ INCORRECT'}`);
      console.log('');
    } else {
      console.log(`⏭️  No pending prediction found for: ${result.matchRef}`);
    }
  }
  
  console.log('\n========================================');
  console.log(`Updated: ${updated} predictions`);
  console.log(`Correct: ${correct} | Incorrect: ${incorrect}`);
  if (updated > 0) {
    console.log(`Accuracy: ${((correct/updated)*100).toFixed(1)}%`);
  }
}

updatePredictions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
