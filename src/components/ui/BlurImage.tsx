/**
 * BlurImage Component
 * 
 * Images load with blur → sharp transition.
 * Premium loading experience like Medium/Unsplash.
 */

'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface BlurImageProps extends Omit<ImageProps, 'onLoad'> {
  /** Blur amount during loading (in pixels) */
  blurAmount?: number;
  /** Transition duration (in ms) */
  transitionDuration?: number;
  /** Custom placeholder color */
  placeholderColor?: string;
  /** Scale up slightly while blurred for premium effect */
  scaleOnLoad?: boolean;
}

export default function BlurImage({
  blurAmount = 20,
  transitionDuration = 500,
  placeholderColor = 'rgb(30, 30, 30)',
  scaleOnLoad = true,
  className = '',
  alt,
  ...props
}: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Delay visibility slightly for smooth transition
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: placeholderColor }}
    >
      <Image
        {...props}
        alt={alt}
        className={`
          transition-all
          ${isVisible ? 'blur-0 opacity-100' : `blur-[${blurAmount}px] opacity-80`}
          ${scaleOnLoad && !isVisible ? 'scale-105' : 'scale-100'}
        `}
        style={{
          filter: isVisible ? 'blur(0)' : `blur(${blurAmount}px)`,
          transform: scaleOnLoad && !isVisible ? 'scale(1.05)' : 'scale(1)',
          opacity: isVisible ? 1 : 0.8,
          transition: `filter ${transitionDuration}ms ease-out, transform ${transitionDuration}ms ease-out, opacity ${transitionDuration}ms ease-out`,
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

/**
 * Avatar with blur loading
 */
interface BlurAvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function BlurAvatar({
  src,
  alt,
  size = 'md',
  className = '',
}: BlurAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-full bg-bg-elevated
        ${sizeClasses[size]} ${className}
      `}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={`
          object-cover rounded-full
          transition-all duration-500 ease-out
        `}
        style={{
          filter: isLoaded ? 'blur(0)' : 'blur(10px)',
          opacity: isLoaded ? 1 : 0.6,
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

/**
 * Card image with blur loading (for blog cards, match cards, etc.)
 */
interface BlurCardImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  className?: string;
}

export function BlurCardImage({
  src,
  alt,
  aspectRatio = 'video',
  className = '',
}: BlurCardImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[2/1]',
  };

  return (
    <div 
      className={`
        relative overflow-hidden bg-bg-elevated
        ${aspectClasses[aspectRatio]} ${className}
      `}
    >
      {/* Shimmer placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-all duration-500 ease-out"
        style={{
          filter: isLoaded ? 'blur(0)' : 'blur(15px)',
          transform: isLoaded ? 'scale(1)' : 'scale(1.1)',
          opacity: isLoaded ? 1 : 0,
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
