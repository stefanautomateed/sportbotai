/**
 * Script to regenerate blog images that have placeholder URLs
 * Uses SVG-based images stored in Vercel Blob (never expires)
 * 
 * Usage: npx tsx scripts/regenerate-blog-images.ts
 */

import { prisma } from '../src/lib/prisma';
import { put } from '@vercel/blob';

// Category-specific styling
const categoryStyles: Record<string, { icon: string; accent1: string; accent2: string }> = {
    "Betting Fundamentals": { icon: "📊", accent1: "#10b981", accent2: "#059669" },
    "Sports Analysis": { icon: "⚽", accent1: "#3b82f6", accent2: "#1d4ed8" },
    "Statistics & Data": { icon: "📈", accent1: "#8b5cf6", accent2: "#6d28d9" },
    "Risk Management": { icon: "🛡️", accent1: "#f59e0b", accent2: "#d97706" },
    "Market Insights": { icon: "💰", accent1: "#10b981", accent2: "#059669" },
    "Educational Guides": { icon: "📚", accent1: "#06b6d4", accent2: "#0891b2" },
};

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function generateSVGImage(
    title: string,
    keyword: string,
    category: string
): Promise<string> {
    const displayTitle = title.length > 50
        ? title.substring(0, 47) + '...'
        : title;

    const words = keyword.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
        if (line1.length + word.length < 40) {
            line1 += (line1 ? ' ' : '') + word;
        } else if (line2.length + word.length < 40) {
            line2 += (line2 ? ' ' : '') + word;
        }
    }

    const style = categoryStyles[category] || categoryStyles["Educational Guides"];

    // Premium card-based SVG design
    const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${style.accent1}"/>
      <stop offset="100%" style="stop-color:${style.accent2}"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <circle cx="100" cy="100" r="200" fill="${style.accent1}" opacity="0.08" filter="url(#glow)"/>
  <circle cx="1100" cy="530" r="220" fill="${style.accent2}" opacity="0.08" filter="url(#glow)"/>
  
  <rect x="100" y="80" width="1000" height="450" rx="24" fill="url(#cardGrad)" filter="url(#shadow)"/>
  
  <rect x="100" y="80" width="1000" height="70" rx="24" fill="url(#accent)"/>
  <rect x="100" y="126" width="1000" height="24" fill="url(#cardGrad)"/>
  
  <text x="600" y="125" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(category.toUpperCase())}</text>
  
  <circle cx="600" cy="260" r="70" fill="#1e293b" stroke="${style.accent1}" stroke-width="3"/>
  <text x="600" y="285" text-anchor="middle" font-size="60">${style.icon}</text>
  
  <text x="600" y="380" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${escapeXml(displayTitle)}</text>
  
  <text x="600" y="430" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="20">${escapeXml(line1)}</text>
  ${line2 ? `<text x="600" y="460" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="20">${escapeXml(line2)}</text>` : ''}
  
  <rect x="400" y="490" width="400" height="2" rx="1" fill="${style.accent1}" opacity="0.5"/>
  
  <rect x="0" y="550" width="1200" height="80" fill="#0f172a"/>
  <rect x="0" y="550" width="1200" height="3" fill="url(#accent)"/>
  
  <circle cx="160" cy="590" r="25" fill="${style.accent1}"/>
  <text x="160" y="598" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="20" font-weight="700">S</text>
  
  <text x="210" y="582" fill="#fff" font-family="Arial, sans-serif" font-size="20" font-weight="700">SportBot AI</text>
  <text x="210" y="604" fill="#64748b" font-family="Arial, sans-serif" font-size="14">AI-Powered Sports Intelligence</text>
  
  <rect x="980" y="565" width="120" height="50" rx="8" fill="#1e293b"/>
  <text x="1040" y="585" text-anchor="middle" fill="${style.accent1}" font-family="Arial, sans-serif" font-size="12" font-weight="600">GUIDE</text>
  <text x="1040" y="605" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="16" font-weight="700">5 min read</text>
</svg>`;

    const slug = keyword
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

    const blob = await put(
        `blog/${slug}-${Date.now()}.svg`,
        svgContent,
        {
            access: 'public',
            contentType: 'image/svg+xml',
        }
    );

    return blob.url;
}

async function main() {
    console.log('🖼️  Regenerating blog images with SVG fallback...\n');

    // Find all blogs with placeholder images
    const blogs = await prisma.blogPost.findMany({
        where: {
            OR: [
                { featuredImage: { contains: 'placehold.co' } },
                { featuredImage: null },
                { featuredImage: '' },
            ],
        },
        select: {
            id: true,
            title: true,
            focusKeyword: true,
            category: true,
            slug: true,
        },
    });

    console.log(`Found ${blogs.length} blogs with placeholder/missing images\n`);

    let success = 0;
    let failed = 0;

    for (const blog of blogs) {
        try {
            console.log(`Processing: ${blog.title?.slice(0, 50)}...`);

            const imageUrl = await generateSVGImage(
                blog.title || blog.slug,
                blog.focusKeyword || blog.slug,
                blog.category || 'Educational Guides'
            );

            await prisma.blogPost.update({
                where: { id: blog.id },
                data: {
                    featuredImage: imageUrl,
                    imageAlt: `${blog.title} - SportBot AI`,
                },
            });

            console.log(`  ✅ Updated: ${imageUrl.slice(0, 60)}...`);
            success++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`  ❌ Failed:`, error);
            failed++;
        }
    }

    console.log(`\n📊 Summary: ${success} success, ${failed} failed`);
    await prisma.$disconnect();
}

main().catch(console.error);
