/**
 * Test script for the new Data Layer
 * Run with: npx tsx scripts/test-data-layer.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔑 API Key loaded:', process.env.API_FOOTBALL_KEY ? 'Yes' : 'No');

import { getDataLayer } from '../src/lib/data-layer';
import type { Sport } from '../src/lib/data-layer/types';

async function testDataLayer() {
  console.log('🧪 Testing Data Layer\n');
  
  const dataLayer = getDataLayer({ logRequests: true });
  
  // Test 1: Check available sports
  console.log('📋 Available Sports:', dataLayer.getAvailableSports());
  console.log('');
  
  // Test 2: Find NBA teams
  console.log('🏀 Testing Basketball (NBA)');
  console.log('━'.repeat(50));
  
  const lakersResult = await dataLayer.findTeam({
    name: 'Lakers',
    sport: 'basketball',
  });
  
  if (lakersResult.success && lakersResult.data) {
    console.log(`✅ Found team: ${lakersResult.data.name} (ID: ${lakersResult.data.externalId})`);
    
    // Get team stats
    const statsResult = await dataLayer.getTeamStats({
      teamId: lakersResult.data.externalId,
      sport: 'basketball',
    });
    
    if (statsResult.success && statsResult.data) {
      console.log(`📊 Stats: ${statsResult.data.record.wins}W - ${statsResult.data.record.losses}L`);
      console.log(`⚡ Scoring: ${statsResult.data.scoring.averageFor.toFixed(1)} PPG`);
    }
    
    // Get recent games
    const gamesResult = await dataLayer.getRecentGames(
      'basketball',
      lakersResult.data.externalId,
      3
    );
    
    if (gamesResult.success && gamesResult.data) {
      console.log(`🎮 Recent Games: ${gamesResult.data.summary.wins}W - ${gamesResult.data.summary.losses}L`);
    }
  } else {
    console.log(`❌ Failed to find Lakers:`, lakersResult.error);
  }
  
  console.log('');
  
  // Test 3: Get enriched match data for NBA
  console.log('🎯 Testing Enriched Match Data (Pacers vs Wizards)');
  console.log('━'.repeat(50));
  
  const enrichedResult = await dataLayer.getEnrichedMatchData(
    'basketball',
    'Indiana Pacers',
    'Washington Wizards',
    {
      includeStats: true,
      includeRecentGames: true,
      includeH2H: true,
      recentGamesLimit: 3,
      h2hLimit: 5,
    }
  );
  
  if (enrichedResult.success && enrichedResult.data) {
    const data = enrichedResult.data;
    console.log(`✅ Home: ${data.homeTeam.team.name}`);
    console.log(`   Stats: ${data.homeTeam.stats?.record.wins}W - ${data.homeTeam.stats?.record.losses}L`);
    console.log(`   Recent: ${data.homeTeam.recentGames?.summary.wins}W - ${data.homeTeam.recentGames?.summary.losses}L`);
    
    console.log(`✅ Away: ${data.awayTeam.team.name}`);
    console.log(`   Stats: ${data.awayTeam.stats?.record.wins}W - ${data.awayTeam.stats?.record.losses}L`);
    console.log(`   Recent: ${data.awayTeam.recentGames?.summary.wins}W - ${data.awayTeam.recentGames?.summary.losses}L`);
    
    if (data.h2h) {
      console.log(`🤝 H2H: ${data.h2h.summary.totalGames} games`);
    }
  } else {
    console.log(`❌ Failed:`, enrichedResult.error);
  }
  
  console.log('');
  
  // Test 4: Test Hockey (NHL)
  console.log('🏒 Testing Hockey (NHL)');
  console.log('━'.repeat(50));
  
  const bruinsResult = await dataLayer.findTeam({
    name: 'Bruins',
    sport: 'hockey',
  });
  
  if (bruinsResult.success && bruinsResult.data) {
    console.log(`✅ Found: ${bruinsResult.data.name} (ID: ${bruinsResult.data.externalId})`);
    
    const statsResult = await dataLayer.getTeamStats({
      teamId: bruinsResult.data.externalId,
      sport: 'hockey',
    });
    
    if (statsResult.success && statsResult.data) {
      console.log(`📊 Stats: ${statsResult.data.record.wins}W - ${statsResult.data.record.losses}L`);
    }
  }
  
  console.log('');
  
  // Test 5: Test NFL
  console.log('🏈 Testing NFL');
  console.log('━'.repeat(50));
  
  const chiefsResult = await dataLayer.findTeam({
    name: 'Chiefs',
    sport: 'american_football',
  });
  
  if (chiefsResult.success && chiefsResult.data) {
    console.log(`✅ Found: ${chiefsResult.data.name} (ID: ${chiefsResult.data.externalId})`);
    
    const statsResult = await dataLayer.getTeamStats({
      teamId: chiefsResult.data.externalId,
      sport: 'american_football',
    });
    
    if (statsResult.success && statsResult.data) {
      console.log(`📊 Stats: ${statsResult.data.record.wins}W - ${statsResult.data.record.losses}L`);
      if (statsResult.data.extended?.division) {
        console.log(`📍 Division: ${statsResult.data.extended.division}`);
      }
    }
  }
  
  console.log('');
  
  // Test 6: Cache stats
  console.log('📦 Cache Stats:', dataLayer.getCacheStats());
  
  console.log('\n✨ Tests complete!');
}

// Run tests
testDataLayer().catch(console.error);
