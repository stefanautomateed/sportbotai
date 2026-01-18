/**
 * Video Background Component
 * 
 * Premium video background with all safeguards:
 * - Poster image fallback (shows immediately)
 * - Mobile detection (static image on phones)
 * - Accessibility (respects reduced motion)
 * - Dark overlay for text readability
 * - Lazy loading for performance (deferred until after LCP)
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  /** Video source (MP4) */
  videoSrc: string;
  /** WebM source for better compression (optional) */
  webmSrc?: string;
  /** Mobile-optimized video source (lower quality, smaller file) */
  mobileSrc?: string;
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
  mobileSrc,
  posterSrc,
  overlayOpacity = 0.6,
  disableOnMobile = false,
  className = '',
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(true); // Default to mobile to prevent video load on SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false); // Defer video loading

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

    // Defer video loading until after initial render (LCP optimization)
    // Shorter delay on desktop (500ms), longer on mobile (1500ms) to save data
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, isMobile ? 1500 : 500);

    return () => {
      window.removeEventListener('resize', checkMobile);
      motionQuery.removeEventListener('change', handleMotionChange);
      clearTimeout(timer);
    };
  }, []);

  // Should we show video? Only after deferred loading and on desktop
  const showVideo = shouldLoadVideo && !hasError && !prefersReducedMotion && !(disableOnMobile && isMobile);

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
      {/* Mobile fallback: Real sports turf texture (Props.Cash style) */}
      {!showVideo && !posterSrc && (
        <div className="absolute inset-0 bg-[#0a0a0b]">
          {/* Base: Real dark sports turf texture image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('/images/turf-bg.jpg')`,
            }}
          />

          {/* Dark vignette overlay for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_80%)]" />

          {/* Subtle brand accent glow (top-right) */}
          <div className="absolute -top-20 -right-20 w-[350px] h-[350px] bg-accent/25 rounded-full blur-[120px]" />

          {/* Secondary ambient glow (bottom-left) */}
          <div className="absolute -bottom-20 -left-20 w-[280px] h-[280px] bg-accent/15 rounded-full blur-[100px]" />
        </div>
      )}

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

      {/* Video (loads on both desktop and mobile, optimized by device) */}
      {showVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          autoPlay
          muted
          loop
          playsInline
          preload={isMobile ? "none" : "metadata"}
          poster={posterSrc}
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={() => setHasError(true)}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          {/* Use mobile-optimized video on mobile if provided */}
          <source src={isMobile && mobileSrc ? mobileSrc : videoSrc} type="video/mp4" />
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
