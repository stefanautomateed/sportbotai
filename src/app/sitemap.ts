import { MetadataRoute } from 'next';

const BASE_URL = 'https://sportbotai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  return [
    // ===========================================
    // HIGH PRIORITY - Core Product Pages
    // ===========================================
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/matches`,
      lastModified: currentDate,
      changeFrequency: 'hourly', // Match data updates frequently
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/ai-desk`,
      lastModified: currentDate,
      changeFrequency: 'hourly', // Live intelligence feed
      priority: 0.95,
    },
    
    // ===========================================
    // MEDIUM PRIORITY - Content & Conversion
    // ===========================================
    {
      url: `${BASE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    
    // ===========================================
    // LOWER PRIORITY - Legal & Compliance
    // ===========================================
    {
      url: `${BASE_URL}/responsible-gambling`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
