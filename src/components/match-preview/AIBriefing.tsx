/**
 * AI Briefing Component
 * 
 * Audio-first AI summary of the match.
 * 60-second briefing with key points highlighted.
 */

'use client';

import { useState } from 'react';

interface BriefingData {
  summary: string;
  keyPoints: string[];
  verdict: string;
  audioUrl?: string;
}

interface AIBriefingProps {
  briefing: BriefingData;
  homeTeam: string;
  awayTeam: string;
}

export default function AIBriefing({
  briefing,
  homeTeam,
  awayTeam,
}: AIBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayAudio = () => {
    if (briefing.audioUrl) {
      const audio = new Audio(briefing.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header with play button */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Match Briefing</h3>
              <p className="text-xs text-text-muted">60-second intelligence summary</p>
            </div>
          </div>
          
          {briefing.audioUrl && (
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isPlaying 
                  ? 'bg-purple-500/20 animate-pulse' 
                  : 'bg-white/10 hover:bg-white/20 hover:scale-105'
              }`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="relative">
          <p className={`text-sm text-text-secondary leading-relaxed ${!isExpanded && 'line-clamp-3'}`}>
            {briefing.summary}
          </p>
          {briefing.summary.length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-purple-400 hover:text-purple-300 mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Key Points */}
        {briefing.keyPoints && briefing.keyPoints.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              Key Points
            </h4>
            <ul className="space-y-2">
              {briefing.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span className="text-text-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verdict */}
        {briefing.verdict && (
          <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">AI Verdict</h4>
                <p className="text-sm text-text-secondary">{briefing.verdict}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Disclaimer */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <p className="text-xs text-text-muted text-center">
          AI analysis for informational purposes only. Past performance doesn&apos;t guarantee future results.
        </p>
      </div>
    </div>
  );
}
