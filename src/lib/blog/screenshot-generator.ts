/**
 * Screenshot Generator for Tool Reviews
 * 
 * Captures screenshots of tool homepages for use as featured images.
 * Uses Puppeteer to render the page and capture a high-quality screenshot.
 */

import { put } from '@vercel/blob';

interface ScreenshotResult {
  url: string;
  width: number;
  height: number;
}

/**
 * Capture a screenshot of a website's homepage
 * 
 * @param websiteUrl - The URL to screenshot
 * @param toolName - Name of the tool (used for filename)
 * @returns Object with the Vercel Blob URL of the screenshot
 */
export async function captureWebsiteScreenshot(
  websiteUrl: string,
  toolName: string
): Promise<ScreenshotResult> {
  console.log(`[Screenshot] Capturing ${websiteUrl}...`);
  
  // Dynamic import for Puppeteer (heavy dependency)
  let browser;
  try {
    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
    
    const page = await browser.newPage();
    
    // Set viewport to desktop size for a nice screenshot
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    
    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Navigate to the page with timeout
    try {
      await page.goto(websiteUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
    } catch (navError) {
      // If networkidle2 times out, try with just load event
      console.log('[Screenshot] networkidle2 timed out, trying load event...');
      await page.goto(websiteUrl, {
        waitUntil: 'load',
        timeout: 15000,
      });
    }
    
    // Wait a bit for any animations/lazy loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to dismiss common cookie banners/popups
    try {
      await page.evaluate(() => {
        // Common cookie consent selectors
        const selectors = [
          '[class*="cookie"] button',
          '[class*="consent"] button',
          '[id*="cookie"] button',
          '[id*="consent"] button',
          '[class*="gdpr"] button',
          '.cc-btn',
          '#onetrust-accept-btn-handler',
          '.accept-cookies',
          '[aria-label*="Accept"]',
          '[aria-label*="accept"]',
        ];
        
        for (const selector of selectors) {
          const btn = document.querySelector(selector) as HTMLElement;
          if (btn && btn.offsetParent !== null) {
            btn.click();
            break;
          }
        }
      });
      // Wait for popup to close
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {
      // Ignore popup dismissal errors
    }
    
    // Take the screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false, // Just the viewport, not full page
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      },
    });
    
    // Convert Uint8Array to Buffer for Vercel Blob
    const buffer = Buffer.from(screenshotBuffer);
    
    await browser.close();
    browser = null;
    
    // Generate a clean filename
    const cleanName = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const filename = `tool-screenshots/${cleanName}-${Date.now()}.png`;
    
    // Upload to Vercel Blob
    console.log('[Screenshot] Uploading to Vercel Blob...');
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    });
    
    console.log(`[Screenshot] ✅ Captured and uploaded: ${blob.url}`);
    
    return {
      url: blob.url,
      width: 1920,
      height: 1080,
    };
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('[Screenshot] Error:', error);
    throw error;
  }
}

/**
 * Capture screenshot with fallback to generated image
 */
export async function captureScreenshotWithFallback(
  websiteUrl: string,
  toolName: string,
  fallbackImage = '/sports/football.jpg'
): Promise<string> {
  try {
    const result = await captureWebsiteScreenshot(websiteUrl, toolName);
    return result.url;
  } catch (error) {
    console.log(`[Screenshot] Failed, using fallback: ${error instanceof Error ? error.message : error}`);
    return fallbackImage;
  }
}
