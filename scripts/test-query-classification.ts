#!/usr/bin/env npx ts-node
/**
 * Query Classification Test Suite
 * 
 * Tests known queries against expected intents.
 * Run after making changes to query-intelligence.ts
 * 
 * Usage: npx tsx scripts/test-query-classification.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for the module
async function loadQueryIntelligence() {
  const mod = await import('../src/lib/query-intelligence.js');
  return mod;
}

// ============================================================================
// TEST CASES: Add problematic queries here when discovered
// ============================================================================

type QueryIntent = 
  | 'PLAYER_STATS'
  | 'TEAM_STATS'
  | 'MATCH_PREDICTION'
  | 'MATCH_RESULT'
  | 'STANDINGS'
  | 'LINEUP'
  | 'INJURY_NEWS'
  | 'TRANSFER_NEWS'
  | 'HEAD_TO_HEAD'
  | 'FORM_CHECK'
  | 'BETTING_ANALYSIS'
  | 'SCHEDULE'
  | 'GENERAL_INFO'
  | 'OUR_ANALYSIS'
  | 'UNCLEAR';

interface TestCase {
  query: string;
  expectedIntent: QueryIntent;
  description?: string;
}

const TEST_CASES: TestCase[] = [
  // SCHEDULE queries (when is the game)
  { query: 'when denver plays next', expectedIntent: 'SCHEDULE', description: 'Single team + plays' },
  { query: 'when do the nuggets play', expectedIntent: 'SCHEDULE' },
  { query: 'when is the lakers game', expectedIntent: 'SCHEDULE' },
  { query: 'next celtics game', expectedIntent: 'SCHEDULE' },
  { query: 'what time does arsenal play', expectedIntent: 'SCHEDULE' },
  { query: 'who do they play next', expectedIntent: 'SCHEDULE' },
  
  // MATCH_PREDICTION queries (who will win)
  { query: 'who will win dallas or chicago', expectedIntent: 'MATCH_PREDICTION', description: 'Two teams' },
  { query: 'lakers vs celtics prediction', expectedIntent: 'MATCH_PREDICTION' },
  { query: 'Roma Sassuolo', expectedIntent: 'MATCH_PREDICTION', description: 'Short match query' },
  { query: 'arsenal chelsea', expectedIntent: 'MATCH_PREDICTION', description: 'Just two team names' },
  { query: 'who wins between miami and boston', expectedIntent: 'MATCH_PREDICTION' },
  
  // INJURY_NEWS queries
  { query: 'how is jokic injury going on', expectedIntent: 'INJURY_NEWS' },
  { query: 'is lebron injured', expectedIntent: 'INJURY_NEWS' },
  { query: 'curry injury update', expectedIntent: 'INJURY_NEWS' },
  { query: 'who is injured on the lakers', expectedIntent: 'INJURY_NEWS' },
  
  // PLAYER_STATS queries
  { query: 'jokic stats this season', expectedIntent: 'PLAYER_STATS' },
  { query: 'how many points is lebron averaging', expectedIntent: 'PLAYER_STATS' },
  { query: 'salah goals 2025', expectedIntent: 'PLAYER_STATS' },
  { query: 'luka ppg', expectedIntent: 'PLAYER_STATS' },
  
  // FORM_CHECK queries
  { query: 'how is arsenal doing', expectedIntent: 'FORM_CHECK' },
  { query: 'celtics recent form', expectedIntent: 'FORM_CHECK' },
  { query: 'how are the lakers playing', expectedIntent: 'FORM_CHECK' },
  
  // MATCH_RESULT queries (past)
  { query: 'who won lakers game yesterday', expectedIntent: 'MATCH_RESULT' },
  { query: 'chelsea arsenal score', expectedIntent: 'MATCH_RESULT' },
  { query: 'did barcelona win', expectedIntent: 'MATCH_RESULT' },
  
  // STANDINGS queries
  { query: 'premier league table', expectedIntent: 'STANDINGS' },
  { query: 'nba standings', expectedIntent: 'STANDINGS' },
  { query: 'who is first in la liga', expectedIntent: 'STANDINGS' },
  
  // BETTING_ANALYSIS queries
  { query: 'should i bet on the lakers', expectedIntent: 'BETTING_ANALYSIS' },
  { query: 'value bet today', expectedIntent: 'BETTING_ANALYSIS' },
  { query: 'best odds for arsenal', expectedIntent: 'BETTING_ANALYSIS' },
  { query: 'over under for nuggets game', expectedIntent: 'BETTING_ANALYSIS' },
  
  // OUR_ANALYSIS queries (asking about SportBot's picks)
  { query: 'what is your prediction for arsenal', expectedIntent: 'OUR_ANALYSIS' },
  { query: 'sportbot pick for tonight', expectedIntent: 'OUR_ANALYSIS' },
  { query: 'what do you think about the lakers game', expectedIntent: 'OUR_ANALYSIS' },
];

// Test cases that should trigger clarification (ambiguous cities)
interface ClarificationTestCase {
  query: string;
  expectClarification: boolean;
  description: string;
}

const CLARIFICATION_TEST_CASES: ClarificationTestCase[] = [
  { query: 'dallas vs chicago', expectClarification: true, description: 'City names only - need sport' },
  { query: 'mavericks vs bulls', expectClarification: false, description: 'Team names - unambiguous (NBA)' },
  { query: 'cowboys vs bears', expectClarification: false, description: 'Team names - unambiguous (NFL)' },
  { query: 'dallas vs chicago nba', expectClarification: false, description: 'Sport specified' },
  { query: 'denver vs boston', expectClarification: true, description: 'Multi-sport cities' },
  { query: 'nuggets vs celtics', expectClarification: false, description: 'Team names - unambiguous' },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('🧪 Query Classification Test Suite\n');
  console.log('='.repeat(70));
  
  // Dynamically load the module
  const { understandQuery } = await loadQueryIntelligence();
  
  let passed = 0;
  let failed = 0;
  const failures: { query: string; expected: string; got: string; description?: string }[] = [];
  
  // Run intent tests
  console.log('\n📋 INTENT CLASSIFICATION TESTS\n');
  
  for (const test of TEST_CASES) {
    try {
      const result = await understandQuery(test.query);
      
      if (result.intent === test.expectedIntent) {
        passed++;
        console.log(`✅ "${test.query.substring(0, 40).padEnd(40)}" → ${result.intent}`);
      } else {
        failed++;
        failures.push({
          query: test.query,
          expected: test.expectedIntent,
          got: result.intent,
          description: test.description,
        });
        console.log(`❌ "${test.query.substring(0, 40).padEnd(40)}" → ${result.intent} (expected: ${test.expectedIntent})`);
      }
    } catch (error) {
      failed++;
      console.log(`💥 "${test.query.substring(0, 40).padEnd(40)}" → ERROR: ${error}`);
    }
  }
  
  // Run clarification tests
  console.log('\n\n🤔 CLARIFICATION DETECTION TESTS\n');
  
  let clarificationPassed = 0;
  let clarificationFailed = 0;
  
  for (const test of CLARIFICATION_TEST_CASES) {
    try {
      const result = await understandQuery(test.query);
      const gotClarification = result.needsClarification === true;
      
      if (gotClarification === test.expectClarification) {
        clarificationPassed++;
        console.log(`✅ "${test.query.padEnd(30)}" → ${gotClarification ? 'NEEDS CLARIFICATION' : 'OK'} (${test.description})`);
      } else {
        clarificationFailed++;
        console.log(`❌ "${test.query.padEnd(30)}" → ${gotClarification ? 'NEEDS CLARIFICATION' : 'OK'} (expected: ${test.expectClarification ? 'NEEDS CLARIFICATION' : 'OK'}) - ${test.description}`);
      }
    } catch (error) {
      clarificationFailed++;
      console.log(`💥 "${test.query.padEnd(30)}" → ERROR: ${error}`);
    }
  }
  
  const totalPassed = passed + clarificationPassed;
  const totalTests = TEST_CASES.length + CLARIFICATION_TEST_CASES.length;
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Intent Tests: ${passed}/${TEST_CASES.length} passed (${((passed / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`📊 Clarification Tests: ${clarificationPassed}/${CLARIFICATION_TEST_CASES.length} passed (${((clarificationPassed / CLARIFICATION_TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`📊 TOTAL: ${totalPassed}/${totalTests} passed (${((totalPassed / totalTests) * 100).toFixed(1)}%)\n`);
  
  if (failures.length > 0) {
    console.log('❌ INTENT FAILURES:\n');
    for (const f of failures) {
      console.log(`  Query: "${f.query}"`);
      console.log(`  Expected: ${f.expected}`);
      console.log(`  Got: ${f.got}`);
      if (f.description) console.log(`  Note: ${f.description}`);
      console.log('');
    }
    
    console.log('💡 To fix: Update patterns in src/lib/query-intelligence.ts');
  }
  
  process.exit(failed > 0 || clarificationFailed > 0 ? 1 : 0);
}

runTests().catch(console.error);
