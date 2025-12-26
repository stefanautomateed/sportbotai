/**
 * Scroll to Top Button
 * 
 * Floating button that appears when user scrolls down.
 * Smooth scroll animation back to top.
 */

'use client';

import { useState, useEffect } from 'react';

interface ScrollToTopProps {
  threshold?: number; // Scroll distance before showing button (default: 400px)
  className?: string;
}

export function ScrollToTop({ threshold = 400, className = '' }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    // Check initial position
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    setIsScrolling(true);
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Reset scrolling state after animation
    setTimeout(() => setIsScrolling(false), 500);
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`
        fixed bottom-20 right-4 z-40
        w-12 h-12 rounded-full
        bg-bg-card/90 backdrop-blur-sm border border-divider
        shadow-lg shadow-black/30
        flex items-center justify-center
        text-text-secondary hover:text-accent hover:border-accent/50
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        animate-in fade-in slide-in-from-bottom-4 duration-300
        ${isScrolling ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <svg 
        className={`w-5 h-5 transition-transform duration-300 ${isScrolling ? '-translate-y-0.5' : ''}`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

export default ScrollToTop;
