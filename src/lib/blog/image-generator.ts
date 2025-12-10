// Replicate API client for AI image generation
// Uses Flux or SDXL for blog featured images

import Replicate from 'replicate';
import { put } from '@vercel/blob';
import { ImageGenerationResult } from './types';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Generate a featured image for a blog post
export async function generateFeaturedImage(
  title: string,
  keyword: string,
  category: string
): Promise<ImageGenerationResult> {
  // Create an image prompt based on the blog content
  const prompt = createImagePrompt(title, keyword, category);

  console.log('[Image Generator] Starting image generation for:', keyword);
  console.log('[Image Generator] Prompt:', prompt);

  try {
    // Use Flux Schnell for fast, quality images
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "16:9", // Good for blog headers
          output_format: "webp",
          output_quality: 90,
        }
      }
    );

    console.log('[Image Generator] Replicate output type:', typeof output);
    console.log('[Image Generator] Replicate output:', JSON.stringify(output).substring(0, 200));

    // Handle different output formats from Replicate
    let imageUrl: string | null = null;
    
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      // Could be a string URL or a FileOutput object
      if (typeof firstItem === 'string') {
        imageUrl = firstItem;
      } else if (firstItem && typeof firstItem === 'object') {
        // FileOutput object has url() method or direct url property
        if ('url' in firstItem && typeof firstItem.url === 'function') {
          imageUrl = await firstItem.url();
        } else if ('url' in firstItem && typeof firstItem.url === 'string') {
          imageUrl = firstItem.url;
        } else if (firstItem.toString && firstItem.toString() !== '[object Object]') {
          imageUrl = firstItem.toString();
        }
      }
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && 'url' in output) {
      imageUrl = typeof output.url === 'function' ? await output.url() : output.url as string;
    }
    
    if (!imageUrl) {
      console.error('[Image Generator] Could not extract URL from output:', output);
      throw new Error('No image URL returned from Replicate');
    }

    console.log('[Image Generator] Image URL:', imageUrl);

    // Download and upload to Vercel Blob for permanent storage
    const blobUrl = await uploadToBlob(imageUrl, keyword);
    console.log('[Image Generator] Blob URL:', blobUrl);

    return {
      url: blobUrl,
      alt: `${title} - SportBot AI`,
      prompt: prompt,
    };

  } catch (error) {
    console.error('[Image Generator] Error:', error);
    throw error;
  }
}

// Create an optimized prompt for sports analytics imagery
function createImagePrompt(title: string, keyword: string, category: string): string {
  const baseStyle = "modern, clean, professional digital illustration, minimalist design, tech aesthetic, blue and green color scheme";
  
  // Category-specific imagery
  const categoryPrompts: Record<string, string> = {
    "Betting Fundamentals": "abstract data visualization, charts and graphs, mathematical symbols, probability concepts",
    "Sports Analysis": "sports stadium, athletic motion, data overlay, analytical dashboard",
    "Statistics & Data": "big data visualization, numbers flowing, statistical charts, infographic style",
    "Risk Management": "balance scale, risk meter, shield icons, financial graphs",
    "Market Insights": "stock market style display, odds boards, trend lines, market analysis",
    "Educational Guides": "open book with data, learning icons, step by step visual, tutorial style",
  };

  const categoryContext = categoryPrompts[category] || categoryPrompts["Educational Guides"];

  // Extract key visual elements from title/keyword
  const sportKeywords = ["football", "basketball", "tennis", "soccer", "baseball", "hockey"];
  const hasSport = sportKeywords.some(sport => 
    keyword.toLowerCase().includes(sport) || title.toLowerCase().includes(sport)
  );

  const sportContext = hasSport 
    ? "subtle sports equipment silhouettes in background, " 
    : "";

  return `${baseStyle}, ${sportContext}${categoryContext}, representing the concept of "${keyword}", no text, no logos, 4k quality, suitable for blog header`;
}

// Upload image from URL to Vercel Blob
async function uploadToBlob(imageUrl: string, keyword: string): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!blobToken) {
    console.warn('BLOB_READ_WRITE_TOKEN not configured, returning original URL');
    return imageUrl;
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Create a slug-friendly filename
    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const filename = `blog/${slug}-${Date.now()}.webp`;

    // Upload to Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    return blob.url;

  } catch (error) {
    console.error('Blob upload error:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

// Generate a placeholder image URL (fallback)
export function getPlaceholderImage(keyword: string): string {
  const encoded = encodeURIComponent(keyword);
  return `https://placehold.co/1200x630/1a365d/ffffff?text=${encoded}`;
}
