'use client';

import React from 'react';
import Image from 'next/image';

interface Fighter {
  id: string;
  name: string;
  photo: string;
  isWinner: boolean;
}

interface MMAFight {
  id: string;
  eventName: string;
  date: string;
  category: string;
  isMainCard: boolean;
  status: string;
  fighter1: Fighter;
  fighter2: Fighter;
}

interface MMAFightCardProps {
  fight: MMAFight;
  onAnalyze?: (fight: MMAFight) => void;
}

export default function MMAFightCard({ fight, onAnalyze }: MMAFightCardProps) {
  const isFinished = fight.status === 'FT';
  const fightDate = new Date(fight.date);
  const formattedDate = fightDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/icons/icon-72x72.png'; // Fallback image
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-green-500/50 transition-all">
      {/* Header */}
      <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">{fight.category}</span>
          {fight.isMainCard && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
              Main Card
            </span>
          )}
        </div>
      </div>

      {/* Fighters */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Fighter 1 */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-2">
              <Image
                src={fight.fighter1.photo || '/icons/icon-72x72.png'}
                alt={fight.fighter1.name}
                fill
                className="object-cover rounded-full bg-gray-700"
                onError={handleImageError}
                unoptimized
              />
              {isFinished && fight.fighter1.isWinner && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className={`text-sm font-medium ${isFinished && fight.fighter1.isWinner ? 'text-green-400' : 'text-white'}`}>
              {fight.fighter1.name}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <span className="text-gray-500 font-bold text-lg">VS</span>
            {isFinished && (
              <span className="text-xs text-gray-500 mt-1">Final</span>
            )}
          </div>

          {/* Fighter 2 */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-2">
              <Image
                src={fight.fighter2.photo || '/icons/icon-72x72.png'}
                alt={fight.fighter2.name}
                fill
                className="object-cover rounded-full bg-gray-700"
                onError={handleImageError}
                unoptimized
              />
              {isFinished && fight.fighter2.isWinner && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className={`text-sm font-medium ${isFinished && fight.fighter2.isWinner ? 'text-green-400' : 'text-white'}`}>
              {fight.fighter2.name}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        {/* Analyze Button */}
        {!isFinished && onAnalyze && (
          <button
            onClick={() => onAnalyze(fight)}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Analyze Fight
          </button>
        )}
      </div>
    </div>
  );
}
