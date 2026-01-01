/**
 * Sport Tabs Component
 * 
 * Premium horizontal scrollable sport category selector.
 * Shows sport icons and names with elegant pill design.
 * Mobile-optimized with snap scrolling.
 */

'use client';

import { getCategoryDisplayInfo } from './utils';

interface SportTabsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  loading?: boolean;
}

export default function SportTabs({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false,
}: SportTabsProps) {
  return (
    <div className="relative">
      {/* Scrollable container with snap - improved touch targets */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
        {categories.map((category) => {
          const display = getCategoryDisplayInfo(category);
          const isSelected = category === selectedCategory;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              disabled={loading}
              className={`
                snap-start flex-shrink-0 flex items-center gap-2 sm:gap-2.5
                px-3.5 py-3 sm:px-4 sm:py-3 min-h-[48px]
                rounded-btn font-medium text-sm
                transition-all duration-200 whitespace-nowrap border
                touch-manipulation
                ${isSelected
                  ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20'
                  : 'bg-bg-card text-text-secondary border-divider hover:border-accent/30 hover:bg-bg-hover'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'}
              `}
            >
              <span className={`text-xl sm:text-lg transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                {display.icon}
              </span>
              <span className="font-semibold hidden xs:inline">{display.shortName}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse hidden sm:block" />
              )}
            </button>
          );
        })}
      </div>

      {/* Fade indicator on right */}
      <div className="absolute right-0 top-0 bottom-2 w-8 sm:w-12 bg-gradient-to-l from-bg to-transparent pointer-events-none" />
    </div>
  );
}
