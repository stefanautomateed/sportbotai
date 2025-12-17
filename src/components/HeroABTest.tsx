/**
 * Hero A/B Test Wrapper
 * 
 * Renders the correct Hero variant based on user assignment.
 * Uses cookies for sticky assignment.
 */

'use client';

import { useEffect, useState } from 'react';
import Hero from './Hero';
import HeroVariantB from './HeroVariantB';
import { 
  type Variant, 
  getTestCookieName, 
  trackVariantExposure,
  ACTIVE_TESTS 
} from '@/lib/ab-testing';

const TEST_ID = 'hero-2024-12';

export default function HeroABTest() {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const cookieName = getTestCookieName(TEST_ID);
    
    // Check for existing cookie
    const cookies = document.cookie.split(';');
    const testCookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
    
    let assignedVariant: Variant;
    
    if (testCookie) {
      const value = testCookie.split('=')[1].trim();
      assignedVariant = (value === 'A' || value === 'B') ? value : 'A';
    } else {
      // Assign new variant
      const test = ACTIVE_TESTS[TEST_ID];
      const random = Math.random() * 100;
      assignedVariant = random < (test?.trafficSplitB || 50) ? 'B' : 'A';
      
      // Set cookie for 30 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `${cookieName}=${assignedVariant};expires=${expires.toUTCString()};path=/`;
    }
    
    setVariant(assignedVariant);
    
    // Track exposure
    trackVariantExposure(TEST_ID, assignedVariant);
  }, []);

  // During SSR or before hydration, show variant A (original) to avoid flash
  if (!mounted || !variant) {
    return <Hero />;
  }

  // Render the assigned variant
  return variant === 'B' ? <HeroVariantB /> : <Hero />;
}
