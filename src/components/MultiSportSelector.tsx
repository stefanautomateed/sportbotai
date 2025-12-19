/**
 * Multi-Sport Selector Component
 * 
 * Allows users to select a sport category and specific league/competition.
 * Uses the sports configuration to display available options.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  SPORTS_CONFIG, 
  SportConfig, 
  getSportsGroupedByCategory 
} from '@/lib/config/sportsConfig';

interface MultiSportSelectorProps {
  /** Currently selected sport key */
  selectedSportKey: string;
  /** Callback when sport is selected */
  onSportChange: (sportKey: string, sportConfig: SportConfig) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

// Sport category icons
const CATEGORY_ICONS: Record<string, string> = {
  'Soccer': '⚽',
  'Basketball': '🏀',
  'American Football': '🏈',
  'Tennis': '🎾',
  'Ice Hockey': '🏒',
  'Combat Sports': '🥊',
  'Baseball': '⚾',
};

export default function MultiSportSelector({
  selectedSportKey,
  onSportChange,
  disabled = false,
  className = '',
}: MultiSportSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Group sports by category
  const groupedSports = useMemo(() => getSportsGroupedByCategory(), []);
  const categories = useMemo(() => Object.keys(groupedSports), [groupedSports]);
  
  // Get sports for selected category
  const sportsInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return groupedSports[selectedCategory] || [];
  }, [selectedCategory, groupedSports]);

  // Auto-select category when sport changes externally
  useEffect(() => {
    if (selectedSportKey) {
      const config = SPORTS_CONFIG[selectedSportKey];
      if (config && config.category !== selectedCategory) {
        setSelectedCategory(config.category);
      }
    }
  }, [selectedSportKey, selectedCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    
    // Auto-select first sport in category
    if (category && groupedSports[category]?.length > 0) {
      const firstSport = groupedSports[category][0];
      onSportChange(firstSport.oddsApiSportKey, firstSport);
    }
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sportKey = e.target.value;
    const config = SPORTS_CONFIG[sportKey];
    if (config) {
      onSportChange(sportKey, config);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Selector */}
      <div>
        <label htmlFor="categorySelect" className="input-label">
          Sport Category
        </label>
        <select
          id="categorySelect"
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={disabled}
          className="input-field"
        >
          <option value="">-- Select Category --</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_ICONS[category] || '🏆'} {category}
            </option>
          ))}
        </select>
      </div>

      {/* League/Competition Selector (only show if category selected) */}
      {selectedCategory && sportsInCategory.length > 0 && (
        <div>
          <label htmlFor="sportSelect" className="input-label">
            League / Competition
          </label>
          <select
            id="sportSelect"
            value={selectedSportKey}
            onChange={handleSportChange}
            disabled={disabled}
            className="input-field"
          >
            <option value="">-- Select League --</option>
            {sportsInCategory.map((sport) => (
              <option key={sport.oddsApiSportKey} value={sport.oddsApiSportKey}>
                {sport.icon} {sport.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Sport Info */}
      {selectedSportKey && SPORTS_CONFIG[selectedSportKey] && (
        <div className="bg-gray-100 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">{SPORTS_CONFIG[selectedSportKey].icon}</span>
            <div>
              <span className="font-medium text-gray-900">
                {SPORTS_CONFIG[selectedSportKey].displayName}
              </span>
              <span className="text-gray-500 text-xs ml-2">
                ({SPORTS_CONFIG[selectedSportKey].category})
              </span>
            </div>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <span>
              {SPORTS_CONFIG[selectedSportKey].hasDraw ? '1X2 Market' : 'Moneyline'}
            </span>
            <span>
              {SPORTS_CONFIG[selectedSportKey].matchTerm.charAt(0).toUpperCase() + 
               SPORTS_CONFIG[selectedSportKey].matchTerm.slice(1)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// QUICK SPORT PICKER (Alternative compact UI)
// ============================================

interface QuickSportPickerProps {
  selectedSportKey: string;
  onSportChange: (sportKey: string) => void;
  disabled?: boolean;
}

export function QuickSportPicker({
  selectedSportKey,
  onSportChange,
  disabled = false,
}: QuickSportPickerProps) {
  // Popular sports for quick access
  const quickSports = [
    { key: 'soccer_epl', name: 'Soccer', icon: '⚽' },
    { key: 'basketball_nba', name: 'NBA', icon: '🏀' },
    { key: 'americanfootball_nfl', name: 'NFL', icon: '🏈' },
    { key: 'icehockey_nhl', name: 'NHL', icon: '🏒' },
    { key: 'tennis_atp_us_open', name: 'Tennis', icon: '🎾' },
    { key: 'mma_mixed_martial_arts', name: 'UFC', icon: '🥊' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {quickSports.map((sport) => (
        <button
          key={sport.key}
          type="button"
          onClick={() => onSportChange(sport.key)}
          disabled={disabled}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all
            flex items-center gap-2
            ${selectedSportKey === sport.key
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span>{sport.icon}</span>
          <span>{sport.name}</span>
        </button>
      ))}
    </div>
  );
}
