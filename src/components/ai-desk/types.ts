/**
 * AI Desk Chat Types
 * 
 * Shared type definitions for the AI Desk chat components.
 */

/**
 * Represents a single message in the chat
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
    usedRealTimeSearch?: boolean;
    followUps?: string[];
    fromCache?: boolean;
    isStreaming?: boolean;
    statusMessage?: string;  // Shows "Searching..." or "Generating..." during processing
    feedbackGiven?: 'up' | 'down' | null;
    timestamp: Date;
    // Data confidence for quality tracking
    dataConfidenceLevel?: string;
    dataConfidenceScore?: number;
}

/**
 * Audio playback states for TTS
 */
export type AudioState = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Voice input states for speech recognition
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';
