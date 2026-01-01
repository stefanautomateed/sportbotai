/**
 * Example: Match Card with Translation
 * 
 * Shows how to use the translation system in a real component
 */

'use client';

import { useMatchTranslation, useAITranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';

interface MatchCardProps {
  match: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    status: string;
    analysis?: string;
  };
  locale: 'en' | 'sr';
}

export default function MatchCardTranslated({ match, locale }: MatchCardProps) {
  // Hook for match data translation (instant, uses static mappings)
  const { translateMatch } = useMatchTranslation(locale);
  
  // Hook for AI analysis translation (async, uses OpenAI)
  const { translate, loading } = useAITranslation(locale);
  
  // State for translated analysis
  const [analysisText, setAnalysisText] = useState(match.analysis || '');
  
  // Translate static match data (instant)
  const translated = translateMatch(match);
  
  // Translate analysis text (async, only if needed)
  useEffect(() => {
    if (match.analysis && locale === 'sr') {
      translate(match.analysis).then(setAnalysisText);
    } else {
      setAnalysisText(match.analysis || '');
    }
  }, [match.analysis, locale, translate]);
  
  return (
    <div className="card-glass p-6">
      {/* League - instantly translated */}
      <div className="text-accent text-sm font-semibold mb-2">
        {translated.league}
      </div>
      
      {/* Teams - instantly translated */}
      <h3 className="text-2xl font-bold text-white mb-4">
        {translated.homeTeam} <span className="text-gray-500">vs</span> {translated.awayTeam}
      </h3>
      
      {/* Status - instantly translated */}
      <div className="text-gray-400 text-sm mb-4">
        {translated.status}
      </div>
      
      {/* Analysis - AI translated (with loading state) */}
      {match.analysis && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h4 className="text-white font-semibold mb-2">
            {locale === 'sr' ? 'Analiza' : 'Analysis'}
          </h4>
          {loading ? (
            <div className="text-gray-400 text-sm">
              {locale === 'sr' ? 'Prevodi se...' : 'Translating...'}
            </div>
          ) : (
            <p className="text-gray-300 text-sm">{analysisText}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Example Usage in Page:
 * 
 * import MatchCardTranslated from '@/components/MatchCardTranslated';
 * 
 * export default function MatchesPage({ locale }: { locale: 'en' | 'sr' }) {
 *   // Fetch matches (always in English from API)
 *   const matches = await fetchMatches();
 *   
 *   return (
 *     <div>
 *       {matches.map(match => (
 *         <MatchCardTranslated 
 *           key={match.id} 
 *           match={match} 
 *           locale={locale} 
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * Result for English (locale='en'):
 * - Premier League
 * - Manchester United vs Liverpool
 * - Live
 * - Analysis: Manchester United dominates possession...
 * 
 * Result for Serbian (locale='sr'):
 * - Premijer Liga
 * - Mančester Junajted vs Liverpul
 * - Uživo
 * - Analiza: Mančester Junajted dominira u posedovanju...
 */
