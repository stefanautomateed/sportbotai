/**
 * Analyzer Page (/analyzer)
 * 
 * Main page for AI-powered multi-sport match analysis.
 * Clean 3-step flow: Select Sport → Select League → Select Match
 */

'use client';

import { useState, useCallback } from 'react';
import { MatchSelector } from '@/components/match-selector';
import { AnalysisResults } from '@/components/analyzer';
import { AnalyzeResponse } from '@/types';

type ViewState = 'form' | 'loading' | 'results' | 'error';

export default function AnalyzerPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResult = useCallback((analysisResult: AnalyzeResponse) => {
    setResult(analysisResult);
    if (analysisResult.success) {
      setViewState('results');
      setErrorMessage(null);
    } else {
      setViewState('error');
      setErrorMessage(analysisResult.error || 'Unknown error occurred');
    }
  }, []);

  const handleLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      setViewState('loading');
      setErrorMessage(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setViewState('form');
    setErrorMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-primary-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Match Analyzer</h1>
              <p className="text-gray-400 text-sm">
                AI-powered probability analysis, value detection, and risk assessment
              </p>
            </div>
            
            {/* Quick Stats */}
            {viewState === 'form' && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 bg-accent-lime rounded-full animate-pulse" />
                  <span>Live data</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Match Selection View */}
        {(viewState === 'form' || viewState === 'loading') && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            {viewState === 'loading' ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-accent-cyan rounded-full animate-spin border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI Analysis in Progress
                </h3>
                <p className="text-gray-500 text-center text-sm max-w-sm mb-4">
                  Running probability calculations, detecting value opportunities, and assessing risk factors...
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
                  Usually takes 5-15 seconds
                </div>
              </div>
            ) : (
              /* Match Selector */
              <MatchSelector onResult={handleResult} onLoading={handleLoading} />
            )}
          </div>
        )}

        {/* Error View */}
        {viewState === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {errorMessage || 'An unexpected error occurred while analyzing the match.'}
                </p>
                <button onClick={handleReset} className="btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {viewState === 'results' && result && (
          <div>
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Analyze Another Match
              </button>
            </div>

            {/* Analysis Results */}
            <AnalysisResults result={result} />
          </div>
        )}
      </section>
    </div>
  );
}
