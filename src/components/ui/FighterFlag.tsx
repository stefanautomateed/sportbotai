/**
 * Fighter Flag Component
 * 
 * Displays country flags for MMA/UFC fighters.
 * Uses a mapping of popular fighters to their nationalities.
 */

'use client';

import React from 'react';

interface FighterFlagProps {
  fighterName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-lg',
  md: 'w-8 h-8 text-xl',
  lg: 'w-10 h-10 text-2xl',
  xl: 'w-12 h-12 text-3xl',
};

/**
 * Fighter nationality mappings
 * Maps fighter names (or parts of names) to their country flag emojis
 */
const FIGHTER_NATIONALITIES: Record<string, string> = {
  // UFC Champions & Top Contenders
  'Islam Makhachev': '🇷🇺',
  'Makhachev': '🇷🇺',
  'Jon Jones': '🇺🇸',
  'Jones': '🇺🇸',
  'Alex Pereira': '🇧🇷',
  'Pereira': '🇧🇷',
  'Leon Edwards': '🇬🇧',
  'Edwards': '🇬🇧',
  'Sean O\'Malley': '🇺🇸',
  'O\'Malley': '🇺🇸',
  'Ilia Topuria': '🇪🇸',
  'Topuria': '🇪🇸',
  'Dricus Du Plessis': '🇿🇦',
  'Du Plessis': '🇿🇦',
  'Alexandre Pantoja': '🇧🇷',
  'Pantoja': '🇧🇷',
  'Merab Dvalishvili': '🇬🇪',
  'Dvalishvili': '🇬🇪',
  'Belal Muhammad': '🇺🇸',
  
  // Popular Fighters
  'Conor McGregor': '🇮🇪',
  'McGregor': '🇮🇪',
  'Khabib Nurmagomedov': '🇷🇺',
  'Nurmagomedov': '🇷🇺',
  'Israel Adesanya': '🇳🇿',
  'Adesanya': '🇳🇿',
  'Kamaru Usman': '🇳🇬',
  'Usman': '🇳🇬',
  'Jorge Masvidal': '🇺🇸',
  'Masvidal': '🇺🇸',
  'Nate Diaz': '🇺🇸',
  'Diaz': '🇺🇸',
  'Dustin Poirier': '🇺🇸',
  'Poirier': '🇺🇸',
  'Justin Gaethje': '🇺🇸',
  'Gaethje': '🇺🇸',
  'Max Holloway': '🇺🇸',
  'Holloway': '🇺🇸',
  'Charles Oliveira': '🇧🇷',
  'Oliveira': '🇧🇷',
  'Amanda Nunes': '🇧🇷',
  'Nunes': '🇧🇷',
  'Valentina Shevchenko': '🇰🇬',
  'Shevchenko': '🇰🇬',
  'Rose Namajunas': '🇺🇸',
  'Namajunas': '🇺🇸',
  'Zhang Weili': '🇨🇳',
  'Weili': '🇨🇳',
  'Yan Xiaonan': '🇨🇳',
  'Xiaonan': '🇨🇳',
  'Alexa Grasso': '🇲🇽',
  'Grasso': '🇲🇽',
  'Brandon Moreno': '🇲🇽',
  'Moreno': '🇲🇽',
  'Deiveson Figueiredo': '🇧🇷',
  'Figueiredo': '🇧🇷',
  'Stipe Miocic': '🇺🇸',
  'Miocic': '🇺🇸',
  'Francis Ngannou': '🇨🇲',
  'Ngannou': '🇨🇲',
  'Ciryl Gane': '🇫🇷',
  'Gane': '🇫🇷',
  'Tom Aspinall': '🇬🇧',
  'Aspinall': '🇬🇧',
  'Curtis Blaydes': '🇺🇸',
  'Blaydes': '🇺🇸',
  'Sergei Pavlovich': '🇷🇺',
  'Pavlovich': '🇷🇺',
  'Jiri Prochazka': '🇨🇿',
  'Prochazka': '🇨🇿',
  'Jamahal Hill': '🇺🇸',
  'Hill': '🇺🇸',
  'Magomed Ankalaev': '🇷🇺',
  'Ankalaev': '🇷🇺',
  'Jan Blachowicz': '🇵🇱',
  'Blachowicz': '🇵🇱',
  'Glover Teixeira': '🇧🇷',
  'Teixeira': '🇧🇷',
  'Robert Whittaker': '🇦🇺',
  'Whittaker': '🇦🇺',
  'Sean Strickland': '🇺🇸',
  'Strickland': '🇺🇸',
  'Paulo Costa': '🇧🇷',
  'Costa': '🇧🇷',
  'Marvin Vettori': '🇮🇹',
  'Vettori': '🇮🇹',
  'Jared Cannonier': '🇺🇸',
  'Cannonier': '🇺🇸',
  'Colby Covington': '🇺🇸',
  'Covington': '🇺🇸',
  'Gilbert Burns': '🇧🇷',
  'Burns': '🇧🇷',
  'Khamzat Chimaev': '🇸🇪',
  'Chimaev': '🇸🇪',
  'Michael Chandler': '🇺🇸',
  'Chandler': '🇺🇸',
  'Beneil Dariush': '🇺🇸',
  'Dariush': '🇺🇸',
  'Rafael Fiziev': '🇦🇿',
  'Fiziev': '🇦🇿',
  'Arman Tsarukyan': '🇦🇲',
  'Tsarukyan': '🇦🇲',
  'Alexander Volkanovski': '🇦🇺',
  'Volkanovski': '🇦🇺',
  'Yair Rodriguez': '🇲🇽',
  'Rodriguez': '🇲🇽',
  'Brian Ortega': '🇺🇸',
  'Ortega': '🇺🇸',
  'Arnold Allen': '🇬🇧',
  'Allen': '🇬🇧',
  'Movsar Evloev': '🇷🇺',
  'Evloev': '🇷🇺',
  'Aljamain Sterling': '🇺🇸',
  'Sterling': '🇺🇸',
  'Henry Cejudo': '🇺🇸',
  'Cejudo': '🇺🇸',
  'Petr Yan': '🇷🇺',
  'Yan': '🇷🇺',
  'Cory Sandhagen': '🇺🇸',
  'Sandhagen': '🇺🇸',
  'Marlon Vera': '🇪🇨',
  'Vera': '🇪🇨',
  'Kai Kara-France': '🇳🇿',
  'Kara-France': '🇳🇿',
  'Amir Albazi': '🇮🇶',
  'Albazi': '🇮🇶',
  'Muhammad Mokaev': '🇬🇧',
  'Mokaev': '🇬🇧',
  
  // Women's Division
  'Julianna Pena': '🇺🇸',
  'Pena': '🇺🇸',
  'Holly Holm': '🇺🇸',
  'Holm': '🇺🇸',
  'Miesha Tate': '🇺🇸',
  'Tate': '🇺🇸',
  'Kayla Harrison': '🇺🇸',
  'Harrison': '🇺🇸',
  'Raquel Pennington': '🇺🇸',
  'Pennington': '🇺🇸',
  'Manon Fiorot': '🇫🇷',
  'Fiorot': '🇫🇷',
  'Erin Blanchfield': '🇺🇸',
  'Blanchfield': '🇺🇸',
  'Maycee Barber': '🇺🇸',
  'Barber': '🇺🇸',
  'Marina Rodriguez': '🇧🇷',
  'Mackenzie Dern': '🇺🇸',
  'Dern': '🇺🇸',
  'Tatiana Suarez': '🇺🇸',
  'Suarez': '🇺🇸',
  
  // Legends
  'Georges St-Pierre': '🇨🇦',
  'St-Pierre': '🇨🇦',
  'GSP': '🇨🇦',
  'Anderson Silva': '🇧🇷',
  'Silva': '🇧🇷',
  'Jose Aldo': '🇧🇷',
  'Aldo': '🇧🇷',
  'Daniel Cormier': '🇺🇸',
  'Cormier': '🇺🇸',
  'Demetrious Johnson': '🇺🇸',
  'Johnson': '🇺🇸',
  'Cain Velasquez': '🇺🇸',
  'Velasquez': '🇺🇸',
  'Randy Couture': '🇺🇸',
  'Couture': '🇺🇸',
  'Chuck Liddell': '🇺🇸',
  'Liddell': '🇺🇸',
  'Tito Ortiz': '🇺🇸',
  'Ortiz': '🇺🇸',
  'Ronda Rousey': '🇺🇸',
  'Rousey': '🇺🇸',
  'Joanna Jedrzejczyk': '🇵🇱',
  'Jedrzejczyk': '🇵🇱',
  
  // Bellator Fighters
  'Patricio Pitbull': '🇧🇷',
  'Pitbull': '🇧🇷',
  'AJ McKee': '🇺🇸',
  'McKee': '🇺🇸',
  'Ryan Bader': '🇺🇸',
  'Bader': '🇺🇸',
  'Fedor Emelianenko': '🇷🇺',
  'Emelianenko': '🇷🇺',
  
  // PFL Fighters
  'Jake Shields': '🇺🇸',
  'Shields': '🇺🇸',
};

/**
 * Try to match fighter name to nationality
 */
function getFighterNationality(fighterName: string): string | null {
  const normalized = fighterName.trim();
  
  // Try exact match first
  if (FIGHTER_NATIONALITIES[normalized]) {
    return FIGHTER_NATIONALITIES[normalized];
  }
  
  // Try case-insensitive match
  const lowerName = normalized.toLowerCase();
  const exactKey = Object.keys(FIGHTER_NATIONALITIES).find(key => 
    key.toLowerCase() === lowerName
  );
  if (exactKey) {
    return FIGHTER_NATIONALITIES[exactKey];
  }
  
  // Try partial match (last name)
  const lastName = normalized.split(' ').pop() || normalized;
  if (FIGHTER_NATIONALITIES[lastName]) {
    return FIGHTER_NATIONALITIES[lastName];
  }
  
  // Try partial match in keys
  const partialKey = Object.keys(FIGHTER_NATIONALITIES).find(key => 
    lowerName.includes(key.toLowerCase()) ||
    key.toLowerCase().includes(lowerName)
  );
  if (partialKey) {
    return FIGHTER_NATIONALITIES[partialKey];
  }
  
  return null;
}

/**
 * Generate fallback initials for unknown fighters
 */
function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/**
 * Generate consistent color from name
 */
function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

export default function FighterFlag({ 
  fighterName, 
  size = 'md',
  className = '' 
}: FighterFlagProps) {
  const flag = getFighterNationality(fighterName);

  // If we found a flag, display it
  if (flag) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 bg-bg-elevated ${className}`}
        title={`${fighterName}`}
      >
        <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}>
          {flag}
        </span>
      </div>
    );
  }

  // Fallback to initials
  return (
    <div 
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ backgroundColor: getColor(fighterName) }}
      title={fighterName}
    >
      <span className="text-white font-bold text-xs">
        {getInitials(fighterName)}
      </span>
    </div>
  );
}

/**
 * Export nationality lookup for use in other components
 */
export { getFighterNationality, FIGHTER_NATIONALITIES };
