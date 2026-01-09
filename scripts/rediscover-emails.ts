/**
 * Re-run email discovery for tools that don't have contact emails
 * Uses improved email finder with Perplexity fallback
 * 
 * Run: npx tsx scripts/rediscover-emails.ts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// User agents for scraping
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findContactEmail(baseUrl: string): Promise<{ email: string | null; source: string }> {
  // Clean URL
  const cleanUrl = baseUrl.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/$/, '');
  
  // Expanded list of pages to check
  const pagesToCheck = [
    cleanUrl,
    `${cleanUrl}/contact`,
    `${cleanUrl}/contact-us`,
    `${cleanUrl}/contactus`,
    `${cleanUrl}/about`,
    `${cleanUrl}/about-us`,
    `${cleanUrl}/aboutus`,
    `${cleanUrl}/team`,
    `${cleanUrl}/our-team`,
    `${cleanUrl}/support`,
    `${cleanUrl}/help`,
    `${cleanUrl}/faq`,
    `${cleanUrl}/legal`,
    `${cleanUrl}/privacy`,
    `${cleanUrl}/terms`,
  ];
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  const emailPriority = [
    /^(hello|hi|contact|info|support|team|help|press|media|partnerships|partner|business|collab)@/i,
    /^[a-z]+@/i,
    /.*/,
  ];
  
  const isBlacklisted = (email: string) => {
    const lower = email.toLowerCase();
    return lower.includes('example.com') ||
           lower.includes('yourdomain') ||
           lower.includes('email.com') ||
           lower.includes('test@') ||
           lower.includes('noreply') ||
           lower.includes('no-reply') ||
           lower.includes('donotreply') ||
           lower.includes('do-not-reply') ||
           lower.includes('unsubscribe') ||
           lower.includes('notifications') ||
           lower.includes('.png') ||
           lower.includes('.jpg') ||
           lower.includes('.svg') ||
           lower.endsWith('.js') ||
           lower.endsWith('.css') ||
           lower.includes('sentry.io') ||
           lower.includes('google.com') ||
           lower.includes('facebook.com') ||
           lower.includes('stripe.com') ||
           lower.includes('cloudflare.com');
  };
  
  for (const pageUrl of pagesToCheck) {
    try {
      await delay(800);
      
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });
      
      if (!response.ok) continue;
      
      const html = await response.text();
      const emails = html.match(emailRegex) || [];
      const filteredEmails = Array.from(new Set(emails)).filter(e => !isBlacklisted(e));
      
      if (filteredEmails.length > 0) {
        for (const priorityRegex of emailPriority) {
          const match = filteredEmails.find(e => priorityRegex.test(e));
          if (match) {
            const source = pageUrl === cleanUrl ? 'homepage' : 
                          pageUrl.includes('contact') ? 'contact_page' :
                          pageUrl.includes('about') ? 'about_page' :
                          pageUrl.includes('support') || pageUrl.includes('help') ? 'support_page' : 'other';
            return { email: match.toLowerCase(), source };
          }
        }
      }
    } catch (error) {
      // Page doesn't exist or timeout
    }
  }
  
  // Fallback: Use Perplexity
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (apiKey) {
    try {
      const domain = new URL(cleanUrl).hostname.replace('www.', '');
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant. Find the contact or support email address for the given website. Return ONLY the email address, nothing else. If you cannot find one, return "NOT_FOUND".',
            },
            {
              role: 'user',
              content: `What is the contact or support email address for ${domain}?`,
            },
          ],
          max_tokens: 100,
          temperature: 0.1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content?.trim() || '';
        const emailMatch = answer.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !answer.includes('NOT_FOUND')) {
          return { email: emailMatch[0].toLowerCase(), source: 'perplexity' };
        }
      }
    } catch (error) {
      // Perplexity failed
    }
  }
  
  return { email: null, source: 'not_found' };
}

async function main() {
  console.log('🔍 Re-discovering emails for tools without contact info...\n');
  
  const toolsNoEmail = await prisma.toolReview.findMany({
    where: {
      contentWords: { gt: 100 },
      blogPostId: null,
      sourceUrl: { contains: 'sportsbettingtools' },
      contactEmail: null,
    },
    select: { id: true, toolName: true, toolUrl: true },
  });
  
  console.log(`Found ${toolsNoEmail.length} tools without email\n`);
  
  let found = 0;
  let failed = 0;
  
  for (const tool of toolsNoEmail) {
    console.log(`\n📧 ${tool.toolName} (${tool.toolUrl})`);
    
    try {
      const result = await findContactEmail(tool.toolUrl);
      
      if (result.email) {
        console.log(`   ✅ Found: ${result.email} (${result.source})`);
        
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: {
            contactEmail: result.email,
            emailSource: result.source,
          },
        });
        found++;
      } else {
        console.log(`   ❌ Not found (${result.source})`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      failed++;
    }
    
    await delay(2000);
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Emails found: ${found}`);
  console.log(`❌ Still missing: ${failed}`);
  console.log(`${'='.repeat(50)}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
