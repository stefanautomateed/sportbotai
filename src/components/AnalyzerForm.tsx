/**
 * Analyzer Form component
 * 
 * Form for entering match data to be analyzed.
 * Sends data to /api/analyze endpoint.
 */

'use client';

import { useState } from 'react';
import { AnalyzeRequest, AnalyzeResponse } from '@/types';

interface AnalyzerFormProps {
  onResult: (result: AnalyzeResponse) => void;
  onLoading: (loading: boolean) => void;
}

export default function AnalyzerForm({ onResult, onLoading }: AnalyzerFormProps) {
  const [error, setError] = useState<string | null>(null);

  // List of sports for select
  const sports = [
    'Soccer',
    'Basketball',
    'Tennis',
    'Hockey',
    'American Football',
    'Baseball',
    'Other',
  ];

  // Handler for submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    onLoading(true);

    const formData = new FormData(e.currentTarget);

    // Validation and parsing data
    const data: AnalyzeRequest = {
      sport: formData.get('sport') as string,
      league: formData.get('league') as string,
      teamA: formData.get('teamA') as string,
      teamB: formData.get('teamB') as string,
      odds: {
        home: parseFloat(formData.get('oddsHome') as string) || 0,
        draw: parseFloat(formData.get('oddsDraw') as string) || 0,
        away: parseFloat(formData.get('oddsAway') as string) || 0,
      },
      userPrediction: formData.get('userPrediction') as string,
      stake: parseFloat(formData.get('stake') as string) || 0,
    };

    // Basic validation
    if (!data.sport || !data.league || !data.teamA || !data.teamB) {
      setError('Please fill in all required fields.');
      onLoading(false);
      return;
    }

    if (data.odds.home <= 0 || data.odds.away <= 0) {
      setError('Odds must be greater than 0.');
      onLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis error');
      }

      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sport and League */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sport" className="input-label">
            Sport *
          </label>
          <select
            id="sport"
            name="sport"
            required
            className="input-field"
          >
            <option value="">Select sport</option>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="league" className="input-label">
            League *
          </label>
          <input
            type="text"
            id="league"
            name="league"
            required
            placeholder="e.g. Premier League, NBA..."
            className="input-field"
          />
        </div>
      </div>

      {/* Team A vs Team B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="teamA" className="input-label">
            Team A (Home) *
          </label>
          <input
            type="text"
            id="teamA"
            name="teamA"
            required
            placeholder="e.g. Manchester United"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="teamB" className="input-label">
            Team B (Away) *
          </label>
          <input
            type="text"
            id="teamB"
            name="teamB"
            required
            placeholder="e.g. Liverpool"
            className="input-field"
          />
        </div>
      </div>

      {/* Odds */}
      <div>
        <label className="input-label">Odds *</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="oddsHome" className="text-xs text-gray-500 mb-1 block">
              1 (Home)
            </label>
            <input
              type="number"
              id="oddsHome"
              name="oddsHome"
              required
              step="0.01"
              min="1"
              placeholder="2.10"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="oddsDraw" className="text-xs text-gray-500 mb-1 block">
              X (Draw)
            </label>
            <input
              type="number"
              id="oddsDraw"
              name="oddsDraw"
              step="0.01"
              min="1"
              placeholder="3.40"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="oddsAway" className="text-xs text-gray-500 mb-1 block">
              2 (Away)
            </label>
            <input
              type="number"
              id="oddsAway"
              name="oddsAway"
              required
              step="0.01"
              min="1"
              placeholder="3.20"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Your prediction and stake */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="userPrediction" className="input-label">
            Your Prediction
          </label>
          <input
            type="text"
            id="userPrediction"
            name="userPrediction"
            placeholder="e.g. 1, X, 2, GG, over 2.5..."
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="stake" className="input-label">
            Stake (€)
          </label>
          <input
            type="number"
            id="stake"
            name="stake"
            step="0.01"
            min="0"
            placeholder="10.00"
            className="input-field"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button type="submit" className="btn-primary w-full text-lg py-4">
        Analyze Match
      </button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        * Required fields. Analysis is for informational purposes only and does not guarantee any outcome.
      </p>
    </form>
  );
}
