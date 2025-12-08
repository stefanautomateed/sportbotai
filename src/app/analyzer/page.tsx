/**
 * Analyzer Page (/analyzer)
 * 
 * Main page for AI-powered multi-sport match analysis.
 * Supports Soccer, NBA, NFL, Tennis, NHL, MMA, and more.
 * 
 * Flow:
 * 1. User selects sport category and league
 * 2. User selects a specific match or enters data manually
 * 3. User optionally provides their pick and stake
 * 4. System fetches match data and calls /api/analyze
 * 5. Results are displayed in structured sections
 */

'use client';

import { useState, useCallback } from 'react';
import MultiSportAnalyzerForm from '@/components/MultiSportAnalyzerForm';
import { AnalysisResults } from '@/components/analyzer';
import { AnalyzeResponse } from '@/types';

type ViewState = 'form' | 'loading' | 'results' | 'error';

export default function AnalyzerPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle analysis result
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

  // Handle loading state
  const handleLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      setViewState('loading');
      setErrorMessage(null);
    }
  }, []);

  // Reset to form
  const handleReset = useCallback(() => {
    setResult(null);
    setViewState('form');
    setErrorMessage(null);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Multi-Sport Analyzer</h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto">
            AI-powered analysis for Soccer, NBA, NFL, Tennis, NHL, and more.
            Get probability estimates, value detection, and risk assessment.
          </p>
          
          {/* Sport Icons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">⚽</span>
              <span className="text-sm">Soccer</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">🏀</span>
              <span className="text-sm">NBA</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">🏈</span>
              <span className="text-sm">NFL</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">🎾</span>
              <span className="text-sm">Tennis</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">🏒</span>
              <span className="text-sm">NHL</span>
            </div>
            <div className="flex items-center gap-2 text-primary-200 bg-primary-800/50 px-3 py-2 rounded-lg">
              <span className="text-xl">🥊</span>
              <span className="text-sm">UFC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-container">
        <div className="max-w-6xl mx-auto">
          
          {/* Form View / Loading View */}
          {(viewState === 'form' || viewState === 'loading') && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left side - Form (wider) */}
              <div className="lg:col-span-3">
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Select Sport &amp; Match
                  </h2>
                  <MultiSportAnalyzerForm onResult={handleResult} onLoading={handleLoading} />
                </div>
              </div>

              {/* Right side - Preview / Loading */}
              <div className="lg:col-span-2">
                {viewState === 'loading' ? (
                  <div className="card">
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative">
                        <svg
                          className="animate-spin h-16 w-16 text-primary-600"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl">🏆</span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">
                        AI Analysis in Progress
                      </h3>
                      <p className="text-gray-500 text-center max-w-xs">
                        Our AI is analyzing the match data, calculating probabilities, 
                        and generating insights...
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                        <span>This usually takes 5-15 seconds</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-gray-100 border-2 border-dashed border-gray-300">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <svg
                        className="w-20 h-20 text-gray-400 mb-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Analysis Results
                      </h3>
                      <p className="text-gray-500 text-sm max-w-xs">
                        Select a match from live events or enter data manually, 
                        then click &quot;Analyze Match&quot; to get AI-powered insights.
                      </p>
                      
                      {/* What you'll get */}
                      <div className="mt-8 text-left w-full">
                        <p className="text-xs text-gray-500 font-semibold mb-3">
                          Your analysis will include:
                        </p>
                        <ul className="space-y-2 text-xs text-gray-500">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Win/Draw probability estimates
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Value betting opportunities
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Risk level assessment
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Team momentum & form
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Market stability analysis
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                            Tactical breakdown
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error View */}
          {viewState === 'error' && (
            <div className="max-w-2xl mx-auto">
              <div className="card bg-red-50 border-2 border-red-200">
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-red-800 mb-2">Analysis Failed</h3>
                  <p className="text-red-700 mb-6 max-w-md">
                    {errorMessage || 'An unexpected error occurred while analyzing the match.'}
                  </p>
                  <button
                    onClick={handleReset}
                    className="btn-primary"
                  >
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
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Analyze Another Match
                </button>
              </div>

              {/* Analysis Results */}
              <AnalysisResults result={result} />
            </div>
          )}

          {/* Disclaimer - Always visible */}
          <div className="mt-8 disclaimer-box">
            <p>
              <strong>⚠️ Disclaimer:</strong> AI analysis is for informational and educational purposes only. 
              It is based on statistical models and does not guarantee accuracy of predictions. 
              All betting is at your own risk. Only bet with money you can afford to lose. 
              If you have a gambling problem, seek help at{' '}
              <a 
                href="https://www.begambleaware.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                BeGambleAware.org
              </a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
