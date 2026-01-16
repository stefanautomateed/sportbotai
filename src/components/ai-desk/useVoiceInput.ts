'use client';

/**
 * useVoiceInput Hook
 * 
 * Manages speech recognition for voice input in chat.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceState } from './types';

// Type declarations for Web Speech API
interface SpeechRecognitionType {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionType;
        webkitSpeechRecognition: SpeechRecognitionType;
    }
}

export interface UseVoiceInputReturn {
    voiceState: VoiceState;
    startVoiceInput: () => void;
    stopVoiceInput: () => void;
}

interface UseVoiceInputOptions {
    onTranscript: (transcript: string) => void;
    onFinalTranscript: (transcript: string) => void;
}

export function useVoiceInput({ onTranscript, onFinalTranscript }: UseVoiceInputOptions): UseVoiceInputReturn {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const transcriptRef = useRef<string>('');

    // Check for speech recognition support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceState('unsupported');
        }
    }, []);

    const startVoiceInput = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceState('unsupported');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setVoiceState('listening');
            transcriptRef.current = '';
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            transcriptRef.current = transcript;
            onTranscript(transcript);

            // If final result, process it
            if (event.results[event.results.length - 1].isFinal) {
                setVoiceState('processing');
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setVoiceState(event.error === 'not-allowed' ? 'unsupported' : 'error');
        };

        recognition.onend = () => {
            // If we have input, send it
            if (transcriptRef.current.trim()) {
                onFinalTranscript(transcriptRef.current.trim());
            }
            setVoiceState('idle');
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [onTranscript, onFinalTranscript]);

    const stopVoiceInput = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setVoiceState('idle');
    }, []);

    return {
        voiceState,
        startVoiceInput,
        stopVoiceInput,
    };
}
