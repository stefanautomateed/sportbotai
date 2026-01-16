'use client';

/**
 * useTextToSpeech Hook
 * 
 * Manages text-to-speech audio playback for chat messages.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioState } from './types';

export interface UseTextToSpeechReturn {
    playingMessageId: string | null;
    audioState: AudioState;
    playMessage: (messageId: string, text: string) => Promise<void>;
    stopAudio: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [audioState, setAudioState] = useState<AudioState>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, []);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        setPlayingMessageId(null);
        setAudioState('idle');
    }, []);

    const playMessage = useCallback(async (messageId: string, text: string) => {
        // If already playing this message, stop it
        if (playingMessageId === messageId && audioState === 'playing') {
            stopAudio();
            return;
        }

        // Stop any currently playing audio
        stopAudio();

        setPlayingMessageId(messageId);
        setAudioState('loading');

        try {
            // Clean text for TTS (remove markdown, links, etc.)
            const cleanText = text
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
                .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
                .replace(/\*([^*]+)\*/g, '$1') // Remove italic
                .replace(/`([^`]+)`/g, '$1') // Remove code
                .replace(/#{1,6}\s/g, '') // Remove headers
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .trim();

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to generate audio');
            }

            // Create audio from base64
            const audioBlob = new Blob(
                [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
                { type: data.contentType }
            );

            const audioUrl = URL.createObjectURL(audioBlob);
            audioUrlRef.current = audioUrl;

            // Create and play audio
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setPlayingMessageId(null);
                setAudioState('idle');
            };

            audio.onerror = () => {
                setAudioState('error');
                setPlayingMessageId(null);
            };

            await audio.play();
            setAudioState('playing');

        } catch (err) {
            console.error('TTS error:', err);
            setAudioState('error');
            setPlayingMessageId(null);
        }
    }, [playingMessageId, audioState, stopAudio]);

    return {
        playingMessageId,
        audioState,
        playMessage,
        stopAudio,
    };
}
