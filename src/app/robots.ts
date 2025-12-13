import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sportbotai.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/matches',
          '/ai-desk',
          '/blog',
          '/pricing',
          '/contact',
          '/terms',
          '/privacy',
          '/responsible-gambling',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/history/',
          '/my-teams/',
          '/login',
          '/register',
          '/match/', // Individual match pages (dynamic, not for indexing)
        ],
      },
      // Be nice to crawlers - allow specific bots faster crawl
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
