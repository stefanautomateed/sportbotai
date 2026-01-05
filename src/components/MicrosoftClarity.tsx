'use client';

import Script from 'next/script';

/**
 * Microsoft Clarity Analytics Component
 * 
 * Provides:
 * - Session recordings
 * - Heatmaps (click, scroll, movement)
 * - Rage click detection
 * - Dead click detection
 * - JavaScript error tracking
 * - User journey insights
 * 
 * Free tier: Unlimited sessions
 * 
 * Setup:
 * 1. Go to https://clarity.microsoft.com
 * 2. Create a project for sportbotai.com
 * 3. Copy the project ID (e.g., "abc123xyz")
 * 4. Add NEXT_PUBLIC_CLARITY_PROJECT_ID to .env.local
 */

export default function MicrosoftClarity() {
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  
  // Don't load in development or if no project ID
  if (!clarityProjectId || process.env.NODE_ENV === 'development') {
    return null;
  }
  
  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityProjectId}");
        `,
      }}
    />
  );
}

// Helper to identify users (call after login)
export function identifyUser(userId: string, sessionData?: Record<string, string>) {
  if (typeof window !== 'undefined' && (window as unknown as { clarity?: (action: string, ...args: unknown[]) => void }).clarity) {
    const clarity = (window as unknown as { clarity: (action: string, ...args: unknown[]) => void }).clarity;
    clarity('identify', userId);
    
    // Optional: Add custom session tags
    if (sessionData) {
      Object.entries(sessionData).forEach(([key, value]) => {
        clarity('set', key, value);
      });
    }
  }
}

// Helper to tag specific pages or actions
export function tagClarityEvent(key: string, value: string) {
  if (typeof window !== 'undefined' && (window as unknown as { clarity?: (action: string, key: string, value: string) => void }).clarity) {
    const clarity = (window as unknown as { clarity: (action: string, key: string, value: string) => void }).clarity;
    clarity('set', key, value);
  }
}
