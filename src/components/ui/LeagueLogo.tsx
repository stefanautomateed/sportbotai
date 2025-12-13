/**
 * League Logo Component
 * 
 * Displays league/competition logos with automatic fallback.
 * Features smooth fade-in transitions and graceful error handling.
 */

'use client';

import { useState } from 'react';
import { getLeagueLogo } from '@/lib/logos';

interface LeagueLogoProps {
  leagueName: string;
  sport?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function LeagueLogo({ 
  leagueName, 
  sport,
  size = 'md',
  className = '' 
}: LeagueLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const logoUrl = getLeagueLogo(leagueName, sport);
  const isFallback = logoUrl.startsWith('data:');

  // Generate initials for fallback
  const getInitials = (name: string) => {
    const words = name.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  // Generate consistent color from name
  const getColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 50%, 40%)`;
  };

  // Fallback component with initials
  const FallbackLogo = () => (
    <div 
      className={`${sizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: getColor(leagueName) }}
    >
      <span className="text-white/90 font-semibold text-[8px]">
        {getInitials(leagueName)}
      </span>
    </div>
  );

  if (hasError || isFallback) {
    return <FallbackLogo />;
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 ${className}`}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 rounded animate-pulse"
          style={{ backgroundColor: `${getColor(leagueName)}40` }}
        />
      )}
      <img
        src={logoUrl}
        alt={`${leagueName} logo`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
