/**
 * Gradient Border Component
 * 
 * Premium cards with subtle animated gradient borders.
 * Creates that premium SaaS feel with moving gradient effect.
 */

'use client';

import { ReactNode } from 'react';

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Gradient colors */
  colors?: string[];
  /** Border radius */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Only show animation on hover */
  hoverOnly?: boolean;
  /** Glow effect */
  glow?: boolean;
}

export default function GradientBorder({
  children,
  className = '',
  borderWidth = 1,
  duration = 3,
  colors = ['#2AF6A0', '#3B82F6', '#8B5CF6', '#2AF6A0'],
  rounded = 'xl',
  hoverOnly = false,
  glow = false,
}: GradientBorderProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;

  return (
    <div
      className={`relative ${roundedClasses[rounded]} p-[${borderWidth}px] ${className}`}
      style={{
        background: gradient,
        backgroundSize: '300% 100%',
        animation: hoverOnly ? 'none' : `gradient-shift ${duration}s ease infinite`,
        padding: borderWidth,
      }}
    >
      {/* Glow effect */}
      {glow && (
        <div
          className="absolute inset-0 blur-xl opacity-30"
          style={{
            background: gradient,
            backgroundSize: '300% 100%',
            animation: `gradient-shift ${duration}s ease infinite`,
          }}
        />
      )}
      
      {/* Inner content */}
      <div className={`relative bg-bg-card ${roundedClasses[rounded]} h-full w-full`}>
        {children}
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        ${hoverOnly ? `
          div:hover {
            animation: gradient-shift ${duration}s ease infinite;
          }
        ` : ''}
      `}</style>
    </div>
  );
}

/**
 * Animated border card - simpler version using CSS
 */
interface AnimatedBorderCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'rainbow';
}

export function AnimatedBorderCard({
  children,
  className = '',
  variant = 'default',
}: AnimatedBorderCardProps) {
  const variantClasses = {
    default: 'animated-border-default',
    accent: 'animated-border-accent',
    rainbow: 'animated-border-rainbow',
  };

  return (
    <div className={`animated-border-card ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
