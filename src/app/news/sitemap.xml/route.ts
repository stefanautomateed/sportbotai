// Google News Sitemap - /news/sitemap.xml
// This sitemap follows Google News sitemap protocol for better indexing
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap

import { prisma } from '@/lib/prisma';
import { SITE_CONFIG } from '@/lib/seo';

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  const baseUrl = SITE_CONFIG.url;

  // Get news articles from last 2 days (Google News only indexes recent content)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const articles = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      publishedAt: { gte: twoDaysAgo },
    },
    select: {
      title: true,
      newsTitle: true,
      slug: true,
      publishedAt: true,
      tags: true,
      sport: true,
      league: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 1000, // Google News sitemap limit
  });

  // Build News Sitemap XML
  const urlEntries = articles.map((article) => {
    const pubDate = article.publishedAt
      ? article.publishedAt.toISOString()
      : new Date().toISOString();

    // Use newsTitle for Google News (journalistic headline)
    const title = (article.newsTitle || article.title)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Keywords from tags (max 10 per Google guidelines)
    const keywords = article.tags.slice(0, 10).join(', ');

    return `  <url>
    <loc>${baseUrl}/news/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>SportBot AI</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      ${keywords ? `<news:keywords>${keywords}</news:keywords>` : ''}
    </news:news>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
