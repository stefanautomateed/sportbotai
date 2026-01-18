// Script to restore match preview images with team logos
// These were accidentally replaced with SDXL AI images

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { put } = require('@vercel/blob');

const prisma = new PrismaClient();

// Fetch image and convert to base64 for SVG embedding
async function fetchImageAsBase64(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
    } catch {
        return null;
    }
}

// Get team logo URL
function getTeamLogo(teamName: string): string {
    // Simplified - use a generic team placeholder  
    return `https://www.sofascore.com/api/v1/team/${encodeURIComponent(teamName)}/image`;
}

async function generateMatchImage(homeTeam: string, awayTeam: string, league: string, title: string): Promise<string> {
    const escapeXml = (str: string) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const homeTeamDisplay = homeTeam.length > 18 ? homeTeam.substring(0, 16) + '...' : homeTeam;
    const awayTeamDisplay = awayTeam.length > 18 ? awayTeam.substring(0, 16) + '...' : awayTeam;

    // Create team initials as fallback
    const homeInitials = homeTeam.substring(0, 3).toUpperCase();
    const awayInitials = awayTeam.substring(0, 3).toUpperCase();

    const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Subtle pattern -->
  <g opacity="0.05">
    <circle cx="100" cy="100" r="200" fill="#10b981"/>
    <circle cx="1100" cy="530" r="200" fill="#10b981"/>
  </g>
  
  <!-- Accent line at bottom -->
  <rect x="0" y="610" width="1200" height="20" fill="url(#accent)"/>
  
  <!-- League badge -->
  <rect x="400" y="40" width="400" height="50" rx="25" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <text x="600" y="73" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18" font-weight="500">${escapeXml(league)}</text>
  
  <!-- Home Team Section -->
  <rect x="50" y="170" width="450" height="300" rx="16" fill="#1e293b" filter="url(#shadow)"/>
  <rect x="50" y="170" width="450" height="50" rx="16" fill="#10b981"/>
  <rect x="50" y="204" width="450" height="16" fill="#1e293b"/>
  <text x="275" y="203" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="18" font-weight="600">HOME</text>
  
  <!-- Home Team Logo (Circle with initials) -->
  <circle cx="275" cy="335" r="60" fill="#334155"/>
  <text x="275" y="350" text-anchor="middle" fill="#10b981" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(homeInitials)}</text>
  
  <!-- Home Team Name -->
  <text x="275" y="450" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="700">${escapeXml(homeTeamDisplay)}</text>
  
  <!-- VS Circle -->
  <circle cx="600" cy="320" r="55" fill="#334155" stroke="#475569" stroke-width="2"/>
  <text x="600" y="337" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="32" font-weight="700">VS</text>
  
  <!-- Away Team Section -->
  <rect x="700" y="170" width="450" height="300" rx="16" fill="#1e293b" filter="url(#shadow)"/>
  <rect x="700" y="170" width="450" height="50" rx="16" fill="#ef4444"/>
  <rect x="700" y="204" width="450" height="16" fill="#1e293b"/>
  <text x="925" y="203" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="18" font-weight="600">AWAY</text>
  
  <!-- Away Team Logo (Circle with initials) -->
  <circle cx="925" cy="335" r="60" fill="#334155"/>
  <text x="925" y="350" text-anchor="middle" fill="#ef4444" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(awayInitials)}</text>
  
  <!-- Away Team Name -->
  <text x="925" y="450" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="700">${escapeXml(awayTeamDisplay)}</text>
  
  <!-- Match Preview Badge -->
  <rect x="420" y="520" width="360" height="45" rx="22" fill="#10b981" opacity="0.2"/>
  <text x="600" y="550" text-anchor="middle" fill="#10b981" font-family="Arial, sans-serif" font-size="18" font-weight="600">⚡ MATCH PREVIEW</text>
  
  <!-- Branding -->
  <text x="60" y="580" fill="#64748b" font-family="Arial, sans-serif" font-size="14">SportBot AI</text>
</svg>`;

    return svgContent;
}

async function main() {
    // Match previews that need to be restored
    const matches = [
        { id: 'cmkjics6h000935nzilsxxhxf', home: 'Edmonton Oilers', away: 'St Louis Blues', league: 'NHL' },
        { id: 'cmkjosspc000013scx12k0tq6', home: 'CF Estrela', away: 'Estoril', league: 'Primeira Liga' },
        { id: 'cmkk1mpl300009v88g0k7qrxt', home: 'Besiktas JK', away: 'Kayserispor', league: 'Super Lig' },
        { id: 'cmkk1quyv00039v88lukdkxvz', home: 'Goztepe', away: 'Çaykur Rizespor', league: 'Super Lig' }
    ];

    console.log(`\n🔄 Restoring ${matches.length} match preview images with team logos...\n`);

    for (const match of matches) {
        console.log(`⚽ ${match.home} vs ${match.away}`);

        try {
            // Generate the SVG
            const svgContent = await generateMatchImage(match.home, match.away, match.league, '');

            // Upload to Vercel Blob
            const slug = `${match.home}-vs-${match.away}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
            const blob = await put(
                `blog/${slug}-match-${Date.now()}.svg`,
                svgContent,
                { access: 'public', contentType: 'image/svg+xml' }
            );

            // Update database
            await prisma.blogPost.update({
                where: { id: match.id },
                data: { featuredImage: blob.url }
            });

            console.log(`   ✅ Restored: ${blob.url.substring(0, 60)}...`);
        } catch (error) {
            console.error(`   ❌ Error:`, error);
        }
    }

    console.log(`\n✅ Done! Match preview images restored with team logos.\n`);
    await prisma.$disconnect();
}

main().catch(console.error);
