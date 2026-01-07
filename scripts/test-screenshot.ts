import 'dotenv/config';
import { captureScreenshotWithFallback, captureWebsiteScreenshot } from '../src/lib/blog/screenshot-generator';

async function test() {
  const testUrls = [
    { name: 'Pickswise', url: 'https://www.pickswise.com/' },
    { name: 'Killer Sports', url: 'https://killersports.com/' },
  ];
  
  for (const { name, url } of testUrls) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    
    try {
      const result = await captureWebsiteScreenshot(url, name);
      console.log(`✅ SUCCESS: ${result.url}`);
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : error}`);
    }
  }
}

test();
