/**
 * Sport Tabs Component
 * 
 * Horizontal scrollable sport category selector.
 * Shows sport icons and names as tabs/pills.
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
      {/* Scrollable container */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {categories.map((category) => {
          const display = getCategoryDisplayInfo(category);
          const isSelected = category === selectedCategory;

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              disabled={loading}
              className={`
                flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                transition-all duration-200 whitespace-nowrap
                ${isSelected
                  ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-lg">{display.icon}</span>
              <span>{display.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Fade indicators for scroll (optional visual cue) */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
    </div>
  );
}
