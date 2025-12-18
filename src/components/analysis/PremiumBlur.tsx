/**
 * Premium Blur Component
 * 
 * Layer 2 of the two-layer blur system.
 * Shows a blur overlay for non-Pro users with a CTA to upgrade.
 * 
 * Design:
 * - Blurred preview of premium content
 * - "Upgrade to Pro" CTA in center
 * - Lock icon and value proposition
 */

'use client';

import Link from 'next/link';

interface PremiumBlurProps {
  /** The content to blur/show */
  children: React.ReactNode;
  /** Whether the user has Pro/Premium access */
  isPro: boolean;
  /** Optional title for the blur overlay */
  title?: string;
  /** Optional description for the blur overlay */
  description?: string;
}

export function PremiumBlur({
  children,
  isPro,
  title = 'Pro Analysis',
  description = 'Upgrade to Pro for detailed match insights, game flow analysis, and AI-powered predictions.',
}: PremiumBlurProps) {
  // If Pro user, just render children normally
  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="relative mt-4">
      {/* Compact blurred preview - just a hint, not full content */}
      <div className="blur-[6px] opacity-20 pointer-events-none select-none max-h-[120px] overflow-hidden">
        {children}
      </div>
      
      {/* Overlay with CTA - compact for quick upgrade */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#050506]/80 backdrop-blur-sm rounded-xl">
        <div className="text-center px-4 py-4 max-w-xs">
          {/* Lock icon - smaller */}
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500/20 to-purple-600/10 rounded-xl flex items-center justify-center mx-auto mb-2 border border-violet-500/20">
            <svg 
              className="w-4 h-4 text-violet-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
              />
            </svg>
          </div>
          
          {/* Title - compact */}
          <h3 className="text-sm font-semibold text-white mb-1">
            {title}
          </h3>
          
          {/* Description - shorter */}
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed line-clamp-2">
            {description}
          </p>
          
          {/* CTA Button - compact */}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
          >
            <span>Upgrade to Pro</span>
            <span className="text-[10px] opacity-75">€9/mo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PremiumBlur;
