/**
 * Translation hooks for client components
 * 
 * Provides easy-to-use hooks for translating content in React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { translateTeam, translateLeague, translatePhrases, needsAITranslation } from '@/lib/translate-client';

/**
 * Hook for translating match data
 */
export function useMatchTranslation(locale: 'en' | 'sr' = 'en') {
  const translateMatch = useCallback((data: {
    homeTeam: string;
    awayTeam: string;
    league?: string;
    [key: string]: any;
  }) => {
    if (locale !== 'sr') return data;

    return {
      ...data,
      homeTeam: translateTeam(data.homeTeam, locale),
      awayTeam: translateTeam(data.awayTeam, locale),
      league: data.league ? translateLeague(data.league, locale) : data.league,
    };
  }, [locale]);

  return { translateMatch, locale };
}

/**
 * Hook for translating AI analysis text
 * Uses API call for complex translations
 */
export function useAITranslation(locale: 'en' | 'sr' = 'en') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (text: string): Promise<string> => {
    if (locale !== 'sr' || !text) return text;

    // For simple phrases, use client-side translation
    if (!needsAITranslation(text)) {
      return translatePhrases(text, locale);
    }

    // For complex text, use AI translation
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: 'analysis' }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.translated || text;
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
      // Fallback to phrase translation
      return translatePhrases(text, locale);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return { translate, loading, error, locale };
}

/**
 * Hook for batch translating multiple texts
 */
export function useBatchTranslation(locale: 'en' | 'sr' = 'en') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateBatch = useCallback(async (texts: string[]): Promise<string[]> => {
    if (locale !== 'sr' || texts.length === 0) return texts;

    // Split into simple and complex texts
    const simple: number[] = [];
    const complex: number[] = [];
    
    texts.forEach((text, index) => {
      if (needsAITranslation(text)) {
        complex.push(index);
      } else {
        simple.push(index);
      }
    });

    // Translate simple texts client-side
    const result = [...texts];
    simple.forEach(index => {
      result[index] = translatePhrases(texts[index], locale);
    });

    // If no complex texts, return early
    if (complex.length === 0) return result;

    // Translate complex texts via API
    setLoading(true);
    setError(null);

    try {
      const complexTexts = complex.map(i => texts[i]);
      
      // Translate in parallel (but limit to 5 concurrent)
      const chunks: string[][] = [];
      for (let i = 0; i < complexTexts.length; i += 5) {
        chunks.push(complexTexts.slice(i, i + 5));
      }

      const translatedChunks = await Promise.all(
        chunks.map(async chunk => {
          return await Promise.all(
            chunk.map(async text => {
              const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, context: 'analysis' }),
              });
              const data = await response.json();
              return data.translated || text;
            })
          );
        })
      );

      const translated = translatedChunks.flat();
      complex.forEach((originalIndex, translatedIndex) => {
        result[originalIndex] = translated[translatedIndex];
      });

      return result;
    } catch (err) {
      console.error('Batch translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
      // Fallback to phrase translation for complex texts too
      complex.forEach(index => {
        result[index] = translatePhrases(texts[index], locale);
      });
      return result;
    } finally {
      setLoading(false);
    }
  }, [locale]);

  return { translateBatch, loading, error, locale };
}

/**
 * Hook for translating text with automatic caching
 */
export function useTranslationCache(locale: 'en' | 'sr' = 'en') {
  const [cache, setCache] = useState<Map<string, string>>(new Map());
  const { translate } = useAITranslation(locale);

  const getCached = useCallback(async (text: string): Promise<string> => {
    if (locale !== 'sr') return text;

    // Check cache first
    if (cache.has(text)) {
      return cache.get(text)!;
    }

    // Translate and cache
    const translated = await translate(text);
    setCache(prev => new Map(prev).set(text, translated));
    return translated;
  }, [locale, cache, translate]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return { getCached, clearCache, cacheSize: cache.size };
}
