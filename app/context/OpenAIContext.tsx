"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// LocalStorage key
const OPENAI_API_KEY_STORAGE = 'openai-api-key';

// Maximum chunk size in characters (approx. 4000)
const TTS_CHUNK_SIZE = 4000;

// Utility to chunk text into segments of up to maxChars
function chunkText(text: string, maxChars = TTS_CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// Singleton AudioManager
class AudioManager {
  private static instance: AudioManager;
  private audioElement: HTMLAudioElement | null = null;
  private currentAudioRequestId: string | null = null;
  private isCancelled: boolean = false;
  private isPlayingAudio: boolean = false;

  private constructor() {
    console.log('[OPENAI-DEBUG] AudioManager initialized');

    // Clean up on page unload
    // window.addEventListener('beforeunload', () => {
    //   this.cleanup();
    // });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public playAudio(blob: Blob, audioRequestId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.stopAudio(); // stop any currently playing audio

        // Create a new audio element
        this.audioElement = new Audio();
        this.currentAudioRequestId = audioRequestId;
        this.isCancelled = false;

        this.audioElement.src = URL.createObjectURL(blob);

        this.audioElement.onended = () => {
          console.log(`[OPENAI-DEBUG] Audio playback completed: ${audioRequestId}`);
          this.isPlayingAudio = false;
          this.cleanup();
          resolve();
        };

        this.audioElement.onplay = () => {
          console.log(`[OPENAI-DEBUG] Audio playback started: ${audioRequestId}`);
          this.isPlayingAudio = true;
        };

        this.audioElement.onerror = (err) => {
          console.error(`[OPENAI-DEBUG] Audio playback error: ${audioRequestId}`, err);
          this.isPlayingAudio = false;
          this.cleanup();
          reject(err);
        };

        console.log(`[OPENAI-DEBUG] Starting audio playback: ${audioRequestId}`);
        this.audioElement.volume = 1.0;

        this.audioElement.play().catch((err) => {
          console.error(`[OPENAI-DEBUG] Failed to start playback: ${audioRequestId}`, err);
          this.isPlayingAudio = false;
          this.cleanup();
          reject(err);
        });
      } catch (error) {
        console.error(`[OPENAI-DEBUG] Unexpected error in playAudio: ${audioRequestId}`, error);
        this.isPlayingAudio = false;
        reject(error);
      }
    });
  }

  public stopAudio(): void {
    if (this.audioElement) {
      console.log(`[OPENAI-DEBUG] Stopping audio: ${this.currentAudioRequestId}`);
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isCancelled = true;
        this.isPlayingAudio = false;
      } catch (err) {
        console.error('[OPENAI-DEBUG] Error stopping audio:', err);
      } finally {
        this.cleanup();
      }
    }
  }

  public isAudioPlaying(): boolean {
    // Prefer the internal state first
    if (this.isPlayingAudio) return true;
    // Fallback to checking the element
    return !!this.audioElement && !this.audioElement.paused;
  }

  public getCurrentRequestId(): string | null {
    return this.currentAudioRequestId;
  }

  public isCurrentRequestCancelled(): boolean {
    return this.isCancelled;
  }

  private cleanup(): void {
    if (this.audioElement) {
      try {
        if (this.audioElement.src) {
          URL.revokeObjectURL(this.audioElement.src);
        }
      } catch (err) {
        console.error('[OPENAI-DEBUG] Error cleaning up audio resources:', err);
      }
    }
    this.audioElement = null;
  }
}

// Get the singleton instance
const audioManager = AudioManager.getInstance();

// Context shape
export interface OpenAIContextType {
  client: OpenAI | null;
  apiKey: string;
  hasApiKey: boolean;
  isApiKeyValid: boolean;
  isAudioPlaying: boolean;
  setApiKey: (key: string) => void;
  say: (text: string, voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer") => Promise<void>;
  stopCurrentAudio: () => void;
  generateCompletion: (messages: ChatCompletionMessageParam[], model?: string) => Promise<string>;
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined);

// Hook
export function useOpenAI() {
  const context = useContext(OpenAIContext);
  if (!context) {
    throw new Error("useOpenAI must be used within an OpenAIProvider");
  }
  return context;
}

export function OpenAIProvider({children}: { children: ReactNode }) {
  const [client, setClient] = useState<OpenAI | null>(null);
  const [apiKey, setApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem(OPENAI_API_KEY_STORAGE) || '';
    if (storedApiKey) setApiKey(storedApiKey);

    // Poll for audio state
    const intervalId = setInterval(() => {
      setIsAudioPlaying(audioManager.isAudioPlaying());
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  // Set API Key + create client
  const setApiKey = useCallback((key: string) => {
    console.log('[OPENAI-DEBUG] setApiKey, length:', key.length);

    setApiKeyState(key);
    setHasApiKey(!!key);

    try {
      localStorage.setItem(OPENAI_API_KEY_STORAGE, key);

      if (key) {
        const newClient = new OpenAI({
          apiKey: key,
          dangerouslyAllowBrowser: true
        });
        setClient(newClient);
        setIsApiKeyValid(true);
        console.log('[OPENAI-DEBUG] OpenAI client initialized');
      } else {
        setClient(null);
        setIsApiKeyValid(false);
      }
    } catch (err) {
      console.error('[OPENAI-DEBUG] Error setting API key:', err);
      setIsApiKeyValid(false);
    }
  }, []);

  // Stop audio
  const stopCurrentAudio = useCallback(() => {
    audioManager.stopAudio();
    setIsAudioPlaying(false);
  }, []);

  // TTS (with chunking and sequential playback)
  const say = useCallback(async (
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
  ): Promise<void> => {

    if (!text.trim()) {
      console.log('[OPENAI-DEBUG] No text to speak, skipping');
      return;
    }

    if (!client) {
      const msg = '[OPENAI-DEBUG] OpenAI client not initialized';
      console.error(msg);
      throw new Error(msg);
    }

    if (!apiKey) {
      const msg = '[OPENAI-DEBUG] No API key provided';
      console.error(msg);
      throw new Error(msg);
    }

    // Split the text into safe-sized chunks
    const chunks = chunkText(text, TTS_CHUNK_SIZE);

    try {
      // Stop any existing audio first
      stopCurrentAudio();

      // Loop through chunks in sequence
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const audioRequestId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 8)}-part${i + 1}`;

        console.log(`[OPENAI-DEBUG] Generating TTS for chunk ${i + 1}/${chunks.length} (length: ${chunk.length}).`);

        // Call TTS
        const response = await client.audio.speech.create({
          model: 'tts-1',
          voice: voice,
          input: chunk
        });

        // If the request was cancelled in the meantime, abort
        if (
          audioManager.isCurrentRequestCancelled() &&
          audioManager.getCurrentRequestId() === audioRequestId
        ) {
          console.log(`[OPENAI-DEBUG] Audio request ${audioRequestId} was cancelled`);
          throw new Error('Audio request cancelled');
        }

        const blob = await response.blob();
        console.log(`[OPENAI-DEBUG] Chunk ${i + 1} blob received (${blob.size} bytes). Playing...`);

        setIsAudioPlaying(true);
        await audioManager.playAudio(blob, audioRequestId);
      }
    } catch (err) {
      console.error('[OPENAI-DEBUG] Error in say():', err);
      throw err;
    } finally {
      setIsAudioPlaying(false);
    }
  }, [client, apiKey, stopCurrentAudio]);

  // Chat completion
  const generateCompletion = useCallback(async (
    messages: ChatCompletionMessageParam[],
    model: string = 'gpt-4'
  ) => {
    if (!client) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      console.log('[OPENAI-DEBUG] Generating completion with model:', model);
      const completion = await client.chat.completions.create({
        model,
        messages
      });

      if (
        !completion.choices ||
        !completion.choices[0] ||
        !completion.choices[0].message ||
        !completion.choices[0].message.content
      ) {
        throw new Error('Invalid response from OpenAI API');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('[OPENAI-DEBUG] Error generating completion:', error);
      throw error;
    }
  }, [client]);

  const value: OpenAIContextType = {
    client,
    apiKey,
    hasApiKey,
    isApiKeyValid,
    isAudioPlaying,
    setApiKey,
    say,
    stopCurrentAudio,
    generateCompletion
  };

  return (
    <OpenAIContext.Provider value={value}>
      {children}
    </OpenAIContext.Provider>
  );
}