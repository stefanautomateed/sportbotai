# Translation System Documentation

## Overview

SportBot AI uses a hybrid translation approach for Serbian (sr) localization:

1. **Static mappings** - For team names, leagues, common phrases (instant, free)
2. **AI translation** - For dynamic content like analysis text (OpenAI GPT-4o-mini)

This approach avoids duplicate API calls while providing high-quality translations.

## Architecture

```
┌─────────────────────────────────────────────┐
│  API Data (English)                         │
│  - Match data from The Odds API             │
│  - Team stats from football-data.org        │
│  - AI analysis from OpenAI                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Translation Layer                          │
│  1. Static mappings (teams, leagues)        │
│  2. AI translation (analysis text)          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Serbian UI (sr routes)                     │
│  - Translated team names                    │
│  - Translated analysis                      │
│  - Serbian UI text (from i18n)              │
└─────────────────────────────────────────────┘
```

## Files

- **`src/lib/translate-client.ts`** - Client-side translations (static mappings)
- **`src/lib/translate.ts`** - Server-side AI translation (OpenAI)
- **`src/hooks/useTranslation.ts`** - React hooks for components
- **`src/app/api/translate/route.ts`** - API endpoint for AI translation

## Usage Examples

### 1. Translating Match Data (Client Components)

```tsx
'use client';

import { useMatchTranslation } from '@/hooks/useTranslation';

export default function MatchCard({ locale }: { locale: 'en' | 'sr' }) {
  const { translateMatch } = useMatchTranslation(locale);
  
  // Original API data (English)
  const matchData = {
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    league: 'Premier League',
  };
  
  // Translate for Serbian users
  const translated = translateMatch(matchData);
  
  return (
    <div>
      <h2>{translated.league}</h2>
      <p>{translated.homeTeam} vs {translated.awayTeam}</p>
    </div>
  );
}
```

**Result (when locale='sr'):**
```
Premijer Liga
Mančester Junajted protiv Liverpul
```

### 2. Translating AI Analysis Text

```tsx
'use client';

import { useAITranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export default function AnalysisCard({ 
  analysis, 
  locale 
}: { 
  analysis: string; 
  locale: 'en' | 'sr';
}) {
  const { translate, loading } = useAITranslation(locale);
  const [translatedText, setTranslatedText] = useState(analysis);
  
  useEffect(() => {
    if (locale === 'sr') {
      translate(analysis).then(setTranslatedText);
    }
  }, [analysis, locale, translate]);
  
  if (loading) return <div>Prevodi se...</div>;
  
  return <p>{translatedText}</p>;
}
```

### 3. Server Component with Static Translation

```tsx
import { translateTeam, translateLeague } from '@/lib/translate-client';

export default function MatchPreview({ locale }: { locale: 'en' | 'sr' }) {
  // Fetch data (always in English)
  const match = await fetchMatchData();
  
  // Translate on server
  const homeTeam = translateTeam(match.homeTeam, locale);
  const awayTeam = translateTeam(match.awayTeam, locale);
  const league = translateLeague(match.league, locale);
  
  return (
    <div>
      <h1>{league}</h1>
      <p>{homeTeam} vs {awayTeam}</p>
    </div>
  );
}
```

### 4. Batch Translation (Multiple Texts)

```tsx
'use client';

import { useBatchTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

export default function KeyInsights({ 
  insights, 
  locale 
}: { 
  insights: string[]; 
  locale: 'en' | 'sr';
}) {
  const { translateBatch, loading } = useBatchTranslation(locale);
  const [translated, setTranslated] = useState(insights);
  
  useEffect(() => {
    if (locale === 'sr') {
      translateBatch(insights).then(setTranslated);
    }
  }, [insights, locale, translateBatch]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {translated.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ul>
  );
}
```

### 5. API Endpoint Usage

```tsx
// Call from any component
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Manchester United dominates possession with 65% ball control.',
    context: 'analysis',
    preserveHtml: false,
  }),
});

const data = await response.json();
console.log(data.translated);
// Output: "Mančester Junajted dominira u posedovanju sa 65% kontrolom lopte."
```

## Adding New Translations

### Static Mappings (Instant, Free)

Add to `src/lib/translate-client.ts`:

```typescript
export const TEAM_TRANSLATIONS: Record<string, string> = {
  // ... existing teams
  'New Team Name': 'Naziv Novog Tima',
};

export const PHRASE_TRANSLATIONS: Record<string, string> = {
  // ... existing phrases
  'New Phrase': 'Nova Fraza',
};
```

### League Names

```typescript
export const LEAGUE_TRANSLATIONS: Record<string, string> = {
  // ... existing leagues
  'New League': 'Nova Liga',
};
```

## Best Practices

### ✅ DO:

1. **Use static mappings** for:
   - Team names
   - League names
   - Common phrases
   - Statuses, positions

2. **Use AI translation** for:
   - Match analysis text
   - News articles
   - Blog posts
   - Dynamic AI-generated content

3. **Cache translations** when possible
4. **Handle loading states** for AI translations
5. **Provide fallbacks** if translation fails

### ❌ DON'T:

1. **Don't duplicate API calls** - Always fetch in English, translate afterwards
2. **Don't translate proper nouns** - Keep player names, manager names in English
3. **Don't translate numbers** - Keep statistics as-is
4. **Don't block UI** - Use loading states for AI translations

## Cost Considerations

### Static Translations (FREE)
- Team names: Instant lookup
- League names: Instant lookup
- Common phrases: Instant lookup
- **Cost: $0**

### AI Translations (GPT-4o-mini)
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- **Typical match analysis (500 words): ~$0.0005** (less than a cent)

### Optimization Tips:

1. **Cache results** - Don't translate same text twice
2. **Batch translations** - Use `translateBatch()` for multiple texts
3. **Use static first** - Try static mappings before AI
4. **Limit calls** - Only translate when `locale === 'sr'`

## Testing

```bash
# Test static translations
npm run test src/lib/translate-client.test.ts

# Test AI translation (requires OPENAI_API_KEY)
npm run test src/lib/translate.test.ts

# Test hooks
npm run test src/hooks/useTranslation.test.ts
```

## Environment Setup

Add to `.env.local`:

```env
# Required for AI translations
OPENAI_API_KEY=sk-...your-key-here

# Optional: Override model
OPENAI_TRANSLATION_MODEL=gpt-4o-mini
```

## Performance

- **Static translations**: < 1ms (instant lookup)
- **AI translations**: 500-2000ms (depends on text length)
- **Batch translations**: 1000-3000ms (parallel processing)

## Migration Guide

### Existing Components

**Before:**
```tsx
<h2>{match.homeTeam} vs {match.awayTeam}</h2>
```

**After:**
```tsx
import { translateTeam } from '@/lib/translate-client';

<h2>
  {translateTeam(match.homeTeam, locale)} vs {translateTeam(match.awayTeam, locale)}
</h2>
```

### Existing API Routes

**Before:**
```typescript
// API returns English data
return { homeTeam: 'Manchester United', ... };
```

**After (no changes needed!):**
```typescript
// Still return English data
return { homeTeam: 'Manchester United', ... };

// Translation happens in components based on locale
```

## Support

- See examples in existing components
- Check `src/components/*I18n.tsx` for reference implementations
- API docs: `/api/translate` endpoint
