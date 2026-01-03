import fs from 'fs';
import path from 'path';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

if (!PEXELS_API_KEY) {
  console.error('❌ PEXELS_API_KEY not found in environment');
  process.exit(1);
}

interface PexelsPhoto {
  id: number;
  src: {
    medium: string;
    large: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

const SPORT_SEARCHES = {
  soccer: 'football stadium night lights cinematic wide',
  basketball: 'basketball arena lights cinematic wide',
  football: 'american football stadium night lights cinematic',
  // hockey is already good - don't touch it
};

async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: PEXELS_API_KEY!,
    },
  });

  if (!response.ok) {
    console.error(`Pexels API error: ${response.status}`);
    return null;
  }

  const data: PexelsResponse = await response.json();
  
  if (data.photos.length === 0) {
    console.log(`No photos found for: ${query}`);
    return null;
  }

  // Return the first result
  return data.photos[0];
}

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`Failed to download: ${url}`);
    return false;
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
  return true;
}

async function main() {
  const outputDir = path.join(process.cwd(), 'public', 'sports');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🔍 Searching Pexels for sport images...\n');

  for (const [sport, query] of Object.entries(SPORT_SEARCHES)) {
    console.log(`📷 ${sport}: "${query}"`);
    
    const photo = await searchPexels(query);
    
    if (photo) {
      console.log(`   Found: ID ${photo.id} - "${photo.alt}"`);
      console.log(`   URL: ${photo.src.medium}`);
      
      const filepath = path.join(outputDir, `${sport}.jpg`);
      const success = await downloadImage(photo.src.medium, filepath);
      
      if (success) {
        console.log(`   ✅ Saved to ${filepath}\n`);
      } else {
        console.log(`   ❌ Failed to save\n`);
      }
    } else {
      console.log(`   ❌ No results\n`);
    }
  }

  console.log('✨ Done! Hockey image was preserved (already good).');
}

main().catch(console.error);
