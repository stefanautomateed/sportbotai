/**
 * Test script for sportsbettingtools.io scraper
 */

import puppeteer from 'puppeteer';

async function testScraper() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📡 Loading sportsbettingtools.io...');
    await page.goto('https://sportsbettingtools.io', { 
      waitUntil: 'networkidle0', 
      timeout: 60000 
    });
    
    // Wait for content to load
    await page.waitForSelector('.grid', { timeout: 15000 });
    
    // Wait for cards to render
    await new Promise(r => setTimeout(r, 3000));
    
    // Extract tool data - improved version
    const tools = await page.evaluate(() => {
      const results: { name: string; url: string; description: string }[] = [];
      const seenNames = new Set<string>();
      
      // Find all cards in the grid
      const cards = document.querySelectorAll('.grid > div');
      
      for (const card of cards) {
        // Get the tool name from heading
        const nameEl = card.querySelector('h2, h3, h4');
        const name = nameEl?.textContent?.trim() || '';
        
        if (!name || seenNames.has(name)) continue;
        
        // Find the "Visit Website" link (the actual tool URL)
        const links = card.querySelectorAll('a[href]');
        let toolUrl = '';
        
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href;
          const text = link.textContent?.toLowerCase() || '';
          
          // Prioritize "Visit Website" links
          if (text.includes('visit website') || text.includes('visit →')) {
            toolUrl = href;
            break;
          }
          
          // Otherwise take first external non-app-store link
          if (!toolUrl && 
              href.startsWith('http') && 
              !href.includes('sportsbettingtools.io') &&
              !href.includes('apps.apple.com') &&
              !href.includes('play.google.com') &&
              !href.includes('discord.com') &&
              !href.includes('discord.gg')) {
            toolUrl = href;
          }
        }
        
        if (!toolUrl) continue;
        
        // Get description
        const descEl = card.querySelector('p');
        const description = descEl?.textContent?.trim().slice(0, 300) || '';
        
        seenNames.add(name);
        results.push({ name, url: toolUrl, description });
      }
      
      return results;
    });
    
    console.log(`\n✅ Found ${tools.length} unique tools:`);
    tools.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name}`);
      console.log(`     URL: ${t.url}`);
      if (t.description) {
        console.log(`     Desc: ${t.description.slice(0, 80)}...`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testScraper();
