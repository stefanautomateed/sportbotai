/**
 * Test Perplexity Pro API
 * Run: npx ts-node scripts/test-perplexity.ts
 */

import 'dotenv/config';

async function testPerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  console.log('🔍 Testing Perplexity Pro API...\n');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  
  if (!apiKey) {
    console.log('❌ PERPLEXITY_API_KEY not found in environment');
    return;
  }

  // Test models in order of capability
  const models = ['sonar', 'sonar-pro'] as const;
  
  for (const model of models) {
    console.log(`\n📡 Testing model: ${model}`);
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: 'What is the current date? Just respond with the date.' }
          ],
          max_tokens: 100,
          temperature: 0.2,
          search_recency_filter: 'day',
          return_citations: true,
        }),
      });

      console.log('   Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.text();
        console.log('   ❌ Error:', error);
        continue;
      }

      const data = await response.json();
      console.log('   ✅ Success!');
      console.log('   📝 Response:', data.choices[0]?.message?.content?.substring(0, 150));
      console.log('   📚 Citations:', data.citations?.length || 0, 'sources');
      console.log('   💰 Tokens used:', data.usage?.total_tokens);
      
    } catch (error) {
      console.log('   ❌ Error:', error);
    }
  }
  
  console.log('\n✨ Perplexity Pro API test complete!');
}

testPerplexity().catch(console.error);
