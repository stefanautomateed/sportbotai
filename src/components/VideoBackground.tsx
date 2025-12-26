/**
 * Video Background Component
 * 
 * Premium video background with all safeguards:
 * - Poster image fallback (shows immediately)
 * - Mobile detection (static image on phones)
 * - Accessibility (respects reduced motion)
 * - Dark overlay for text readability
 * - Lazy loading for performance
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  /** Video source (MP4) */
  videoSrc: string;
  /** WebM source for better compression (optional) */
  webmSrc?: string;
  /** Poster image shown while loading (optional) */
  posterSrc?: string;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Disable video on mobile */
  disableOnMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function VideoBackground({
  videoSrc,
  webmSrc,
  posterSrc,
  overlayOpacity = 0.6,
  disableOnMobile = true,
  className = '',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check for mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for motion preference changes
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Should we show video?
  const showVideo = !hasError && !prefersReducedMotion && !(disableOnMobile && isMobile);

  // Try to play video when conditions are met
  useEffect(() => {
    if (showVideo && videoRef.current && isVideoLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, fall back to poster
        setHasError(true);
      });
    }
  }, [showVideo, isVideoLoaded]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Poster image fallback (if provided) */}
      {posterSrc && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url(${posterSrc})`,
            opacity: showVideo && isVideoLoaded ? 0 : 1,
          }}
        />
      )}
      
      {/* Video (only on desktop with no reduced motion) */}
      {showVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterSrc}
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setHasError(true)}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      
      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 bg-bg-primary"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </div>
  );
}
