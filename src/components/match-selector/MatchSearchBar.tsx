/**
 * Match Search Bar Component
 * 
 * Search input for filtering matches by team name.
 * Clean, minimal design with clear button.
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface MatchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  totalMatches?: number;
  filteredMatches?: number;
}

export default function MatchSearchBar({
  value,
  onChange,
  placeholder = 'Search by team name...',
  disabled = false,
  totalMatches,
  filteredMatches,
}: MatchSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showResultCount = value.trim() && filteredMatches !== undefined && totalMatches !== undefined;

  return (
    <div className="relative">
      <div
        className={`
          relative flex items-center bg-white border rounded-xl transition-all duration-200
          ${isFocused ? 'border-accent-cyan shadow-sm shadow-accent-cyan/10' : 'border-gray-200'}
          ${disabled ? 'bg-gray-50 opacity-60' : ''}
        `}
      >
        {/* Search icon */}
        <div className="pl-4 pr-2">
          <svg
            className={`w-5 h-5 transition-colors ${isFocused ? 'text-accent-cyan' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 py-3 pr-4 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none text-sm"
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-2 mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!value && !isFocused && (
          <div className="hidden sm:flex items-center gap-1 pr-3 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">⌘K</kbd>
          </div>
        )}
      </div>

      {/* Result count */}
      {showResultCount && (
        <div className="absolute right-0 -bottom-6 text-xs text-gray-500">
          {filteredMatches} of {totalMatches} matches
        </div>
      )}
    </div>
  );
}
