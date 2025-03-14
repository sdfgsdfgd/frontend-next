"use client";

import React, { RefObject, useEffect, useRef, useState } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useOpenAI } from '../context/OpenAIContext';
import { useUserSettings } from '../context/UserSettingsContext';
import { LuxurySpinner, LunarSpinner, ElegantSpinner } from './ui/ElegantSpinner';

// Message type definitions
type MessageType = 'user' | 'ai';

interface Message {
  text: string;
  type: MessageType;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messageStyles: Record<MessageType, string>;
  messagesEndRef: RefObject<HTMLDivElement>;
}

// Keep track of which messages have been auto-played across remounts
// This stays persistent even when the component remounts
const autoPlayedMessages = new Set<string>();

export default function MessageList({
                                      messages,
                                      isTyping,
                                      messageStyles,
                                      messagesEndRef
                                    }: MessageListProps) {
  const { say, hasApiKey, isAudioPlaying, stopCurrentAudio } = useOpenAI();
  const { autoVoiceEnabled } = useUserSettings();
  
  // Use a state variable to track mounting state
  const [isMounted, setIsMounted] = useState(false);
  
  // Track which message is currently being played
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  
  // Track the most recently auto-played message
  const [lastAutoPlayedIndex, setLastAutoPlayedIndex] = useState<number | null>(null);
  
  // Keep track of first render to handle welcome message correctly
  const isFirstRender = useRef(true);
  
  // Sync our local playingMessageIndex with global isAudioPlaying
  useEffect(() => {
    // If global audio state is playing but we don't have a playing index, set it to 0 if it's welcome message
    if (isAudioPlaying && playingMessageIndex === null && messages.length > 0 && isFirstRender.current) {
      if (messages[0].type === 'ai') {
        console.log('[MESSAGELIST-DEBUG] Detected welcome message playing, syncing state');
        setPlayingMessageIndex(0);
        isFirstRender.current = false;
      }
    }
    
    // If audio stopped playing globally, reset our local state
    if (!isAudioPlaying && playingMessageIndex !== null) {
      console.log('[MESSAGELIST-DEBUG] Audio stopped playing globally, resetting local state');
      // Use a small delay to prevent flickering
      setTimeout(() => {
        setPlayingMessageIndex(null);
      }, 300);
    }
  }, [isAudioPlaying, playingMessageIndex, messages]);
  
  // On mount, set mounted flag to true
  useEffect(() => {
    console.log('[MESSAGELIST-DEBUG] MessageList component mounted');
    setIsMounted(true);
    
    return () => {
      console.log('[MESSAGELIST-DEBUG] MessageList component unmounting');
      // No need to stop audio on unmount since AudioManager is now persistent
      setIsMounted(false);
    };
  }, []);

  // Auto-play the latest AI message if auto-voice is enabled
  useEffect(() => {
    if (!messages.length || !hasApiKey || isAudioPlaying || !isMounted || !autoVoiceEnabled) return;
    
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];
    
    // Only auto-play AI messages
    if (lastMessage.type === 'ai') {
      // Create a unique identifier for this message to track if it's been played
      const messageId = `message-${lastMessageIndex}-${lastMessage.text.substring(0, 20)}`;
      
      if (!autoPlayedMessages.has(messageId)) {
        console.log('[MESSAGELIST-DEBUG] Auto-playing latest AI message:', lastMessage.text.substring(0, 50) + '...');
        
        // Mark message as played immediately to prevent multiple play attempts
        autoPlayedMessages.add(messageId);
        
        // Set playing message index to this message
        setPlayingMessageIndex(lastMessageIndex);
        setLastAutoPlayedIndex(lastMessageIndex);
        
        say(lastMessage.text)
          .then(() => {
            console.log('[MESSAGELIST-DEBUG] Auto-play completed');
            // Use a small delay to prevent flickering
            setTimeout(() => {
              setPlayingMessageIndex(null);
            }, 300);
          })
          .catch(err => {
            console.error('[MESSAGELIST-DEBUG] Error auto-playing message:', err);
            setPlayingMessageIndex(null);
          });
      } else {
        console.log('[MESSAGELIST-DEBUG] Skipping auto-play for already played message:', messageId);
      }
    }
  }, [messages, hasApiKey, isAudioPlaying, autoVoiceEnabled, say, isMounted]);

  // Special handling for welcome message
  useEffect(() => {
    // Handle the welcome message scenario specifically
    if (messages.length === 1 && messages[0].type === 'ai' && isAudioPlaying && playingMessageIndex === null) {
      console.log('[MESSAGELIST-DEBUG] Welcome message is playing, setting playing index to 0');
      setPlayingMessageIndex(0);
    }
  }, [messages, isAudioPlaying, playingMessageIndex]);

  // Improved function to speak the message text using the say function
  const speakMessage = (text: string, messageIndex: number) => {
    console.log('[MESSAGELIST-DEBUG] speakMessage called with text length:', text.length, 'for message index:', messageIndex);
    console.log('[MESSAGELIST-DEBUG] Audio state:', { 
      hasApiKey, 
      isAudioPlaying, 
      isMounted 
    });
    
    if (hasApiKey && !isAudioPlaying) {
      console.log('[MESSAGELIST-DEBUG] Calling say() function with text:', text.substring(0, 50) + '...');
      
      // Set the currently playing message index
      setPlayingMessageIndex(messageIndex);
      
      // Handle the promise outside of the state check to ensure it runs
      // even if the component is unmounted later
      say(text)
        .then(() => {
          console.log('[MESSAGELIST-DEBUG] say() function completed successfully');
          // Use a small delay to prevent flickering
          setTimeout(() => {
            setPlayingMessageIndex(null);
          }, 300);
        })
        .catch((err: Error) => {
          console.error('[MESSAGELIST-DEBUG] Error speaking message:', err);
          setPlayingMessageIndex(null);
        });
    } else if (isAudioPlaying) {
      console.log('[MESSAGELIST-DEBUG] Not speaking message - audio already playing');
    } else if (!hasApiKey) {
      console.log('[MESSAGELIST-DEBUG] Not speaking message - no API key');
    }
  };

  // Voice button click handler - separate from the button itself
  const handleVoiceButtonClick = (e: React.MouseEvent, text: string, messageIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get current playing state - might have changed since render
    const currentlyPlaying = isAudioPlaying;
    console.log('[MESSAGELIST-DEBUG] Voice button clicked, isAudioPlaying:', currentlyPlaying, 'for message index:', messageIndex);
    
    if (!currentlyPlaying) {
      // Not playing, so start playing
      console.log('[MESSAGELIST-DEBUG] Starting audio playback from button click');
      speakMessage(text, messageIndex);
    } else {
      // Already playing, so stop it
      console.log('[MESSAGELIST-DEBUG] Stopping audio playback from button click');
      stopCurrentAudio();
      // Use a small delay to prevent flickering
      setTimeout(() => {
        setPlayingMessageIndex(null);
      }, 100);
    }
  };

  // Function to stop current audio playback
  const handleStopAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent button click
    console.log('[MESSAGELIST-DEBUG] Manually stopping audio playback');
    stopCurrentAudio();
    // Use a small delay to prevent flickering
    setTimeout(() => {
      setPlayingMessageIndex(null);
    }, 100);
  };

  return (
    <div className="flex-1 overflow-visible flex flex-col justify-end p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`
            relative
            w-fit
            max-w-[80%]
            px-4 py-2
            rounded-xl
            ${messageStyles[message.type]}
            fadeInDown
          `}
          style={{
            animation: "fadeInDown 2.5s ease forwards",
            opacity: 0.2
          }}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <span className="luxury-text luxury-input text-sm sm:text-base">
                {message.text}
              </span>
            </div>
            
            {/* Voice button - only for AI messages */}
            {message.type === 'ai' && hasApiKey && (
              <div className="flex items-center">
                {/* Auto-played indicator dot */}
                {lastAutoPlayedIndex === index && playingMessageIndex !== index && (
                  <div 
                    className="mr-1 h-2 w-2 rounded-full bg-[rgba(138,101,52,0.5)]"
                    title="Auto-played message"
                  />
                )}
                
                <button
                  className={`ml-2 p-1 transition-colors ${
                    playingMessageIndex === index
                      ? 'text-[rgba(138,101,52,0.9)]' 
                      : 'text-[rgba(138,101,52,0.6)] hover:text-[rgba(138,101,52,0.9)]'
                  }`}
                  onClick={(e) => handleVoiceButtonClick(e, message.text, index)}
                  title={playingMessageIndex === index ? "Stop audio" : "Speak this message"}
                  aria-label={playingMessageIndex === index ? "Stop audio" : "Speak this message"}
                >
                  {playingMessageIndex === index ? (
                    <div className="flex items-center space-x-1">
                      <ElegantSpinner size={16} color="rgba(138,101,52,0.9)" />
                      <button 
                        onClick={handleStopAudio}
                        className="ml-1 p-1 rounded hover:bg-gray-700/20"
                        title="Stop audio"
                        aria-label="Stop audio playback"
                      >
                        <FaVolumeMute size={14} />
                      </button>
                    </div>
                  ) : (
                    <FaVolumeUp size={16} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="w-fit max-w-[80%] self-start p-3 rounded-xl bg-black/30 backdrop-blur-md border border-[rgba(138,101,52,0.2)]">
          <div className="flex items-center space-x-3">
            <LuxurySpinner size={26} />
            <span className="text-[rgba(138,101,52,0.8)] text-sm opacity-80">
              Generating response...
            </span>
          </div>
        </div>
      )}

      {/* Always scroll to here */}
      <div ref={messagesEndRef}/>
    </div>
  );
}
