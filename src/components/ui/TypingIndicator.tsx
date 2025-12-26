/**
 * AI Typing Indicator
 * 
 * Animated dots indicator shown when AI is processing/thinking.
 * Premium feel with smooth bouncing animation.
 */

'use client';

interface TypingIndicatorProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom color */
  color?: string;
  /** Show label text */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Additional classes */
  className?: string;
}

export default function TypingIndicator({
  size = 'md',
  color,
  showLabel = false,
  label = 'AI is thinking',
  className = '',
}: TypingIndicatorProps) {
  const sizeConfig = {
    sm: { dot: 'w-1.5 h-1.5', gap: 'gap-1', text: 'text-xs' },
    md: { dot: 'w-2 h-2', gap: 'gap-1.5', text: 'text-sm' },
    lg: { dot: 'w-2.5 h-2.5', gap: 'gap-2', text: 'text-base' },
  };

  const config = sizeConfig[size];
  const dotColor = color || 'bg-accent';

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <div className={`flex items-center ${config.gap}`}>
        <span
          className={`${config.dot} ${dotColor} rounded-full animate-typing-dot`}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={`${config.dot} ${dotColor} rounded-full animate-typing-dot`}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={`${config.dot} ${dotColor} rounded-full animate-typing-dot`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      {showLabel && (
        <span className={`${config.text} text-gray-400 ml-2`}>{label}</span>
      )}
    </div>
  );
}

/**
 * AI Thinking Card - Full card with typing indicator
 */
interface AIThinkingCardProps {
  message?: string;
  className?: string;
}

export function AIThinkingCard({
  message = 'Analyzing your request...',
  className = '',
}: AIThinkingCardProps) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-bg-elevated rounded-xl border border-divider ${className}`}>
      {/* AI Avatar */}
      <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-white">SportBot AI</span>
          <span className="text-xs text-gray-500">thinking...</span>
        </div>
        <div className="flex items-center gap-3">
          <TypingIndicator size="md" />
          <span className="text-sm text-gray-400">{message}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline typing for chat bubbles
 */
export function InlineTyping({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '300ms' }} />
    </span>
  );
}
