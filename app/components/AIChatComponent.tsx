"use client";

import React, { useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import useOpenAI from "../hooks/useOpenAI";
import { useUserSettings } from "../context/UserSettingsContext";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "../globals.css";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { useOpenAI as useOpenAIContext } from '../context/OpenAIContext';

type MessageType = "user" | "ai";
const MSG_USER: MessageType = "user";
const MSG_AI: MessageType = "ai";

// Persistent flag to track if the welcome message has been played in this session
const SESSION_WELCOME_KEY = 'welcome_message_played';

function findNearestScrollableParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const style = window.getComputedStyle(el);
  const overflowY = style.getPropertyValue("overflow-y");
  const isScrollable = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
  return isScrollable ? el : findNearestScrollableParent(el.parentElement);
}

const messageStyles: Record<MessageType, string> = {
  user: `
    bg-gradient-to-r from-gray-800 to-gray-900 
    text-white
    shadow-xl shadow-black/50
    border border-[rgba(138,101,52,0.3)]
    backdrop-blur-sm
    self-end
    hover:scale-[1.01]
    transition
    duration-300
    text-opacity-85
    text-shadow
    animate-elegant-text-glow
  `,
  ai: `
    bg-gradient-to-r from-transparent via-gray-800 to-transparent
    text-[rgba(138,101,52,0.8)]
    shadow-2xl shadow-[rgba(138,101,52,0.1)]
    border border-[rgba(138,101,52,0.2)]
    backdrop-blur-sm
    self-start
    animate-colorCycleGlow
    hover:scale-[1.01]
    transition
    duration-300
    text-shadow
    animate-elegant-text-glow
  `
};

export default function AIChatComponent({ className }: { className?: string }) {
  const [messages, setMessages] = useState<{ text: string; type: MessageType }[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const debouncedInput = useDebounce(input, 300);
  const [isGeneratingCompletion, setIsGeneratingCompletion] = useState<boolean>(false);
  
  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);
  
  // Track if this is the first mount for welcome message
  const isFirstMount = useRef<boolean>(true);
  
  // Get OpenAI context functions and user settings
  const { generateCompletion, isApiKeyValid, hasApiKey, say, stopCurrentAudio, isAudioPlaying } = useOpenAI();
  const { autoVoiceEnabled } = useUserSettings();
  const { generateCompletion: contextGenerateCompletion } = useOpenAIContext();

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Debug log on mount with welcome message - single consolidated welcome message
  useEffect(() => {
    console.log("[AICHAT-DEBUG] AIChatComponent mounted");
    console.log("[AICHAT-DEBUG] Context state:", {
      hasApiKey,
      isAudioPlaying,
      autoVoiceEnabled
    });
    
    // Reference to track if component is still mounted
    let isMounted = true;
    // Timer reference for cleanup
    let welcomeTimer: NodeJS.Timeout | null = null;
    
    // Check if we've already played the welcome message in this session
    const hasPlayedWelcomeMessage = sessionStorage.getItem(SESSION_WELCOME_KEY) === 'true';
    
    // Create a welcome message only if we have API key and it's the first mount
    // and we haven't played the welcome message yet this session
    if (hasApiKey && isFirstMount.current && !hasPlayedWelcomeMessage) {
      isFirstMount.current = false;
      console.log('[AICHAT-DEBUG] First mount with API key, adding welcome message');
      
      const welcomeMessage = "Now let me understand the Codebase, please wait, this may take a while";
      
      // Important: Set the welcome message BEFORE playing audio to ensure it's visible
      setMessages([{text: welcomeMessage, type: MSG_AI}]);
      
      // CRITICAL FIX: Directly mark that we've played the welcome message in this session
      // to avoid any issues with re-renders or missed session storage updates
      sessionStorage.setItem(SESSION_WELCOME_KEY, 'true');
      
      // Only play welcome message if auto-voice is enabled
      if (autoVoiceEnabled) {
        console.log('[AICHAT-DEBUG] Auto-voice enabled, scheduling welcome message playback');
        
        // IMPORTANT: Guaranteed playback with shorter, more reliable delay
        welcomeTimer = setTimeout(() => {
          // Only proceed if component is still mounted
          if (!isMounted) {
            console.error('[AICHAT-DEBUG] Component unmounted before welcome audio could play');
            return;
          }
          
          // Only play audio if component is still mounted and no audio is playing
          console.log('[AICHAT-DEBUG] Playing welcome message audio:', {
            hasApiKey,
            isAudioPlaying,
            componentStillMounted: isMounted
          });
          
          // IMPORTANT: Force play the welcome message, ignoring audio playing state
          // since this is a critical user experience feature
          stopCurrentAudio(); // Make sure no other audio is playing
          console.log('[AICHAT-DEBUG] Playing welcome message audio (auto-voice enabled)');
          
          say(welcomeMessage)
            .then(() => {
              if (isMounted) {
                console.log('[AICHAT-DEBUG] Welcome message audio completed successfully');
              }
            })
            .catch((err: Error) => {
              if (isMounted) {
                console.error("[AICHAT-DEBUG] Failed to play welcome message:", err);
              }
            });
        }, 500);
      } else {
        console.log('[AICHAT-DEBUG] Auto-voice disabled, skipping welcome message audio');
      }
    } else {
      console.log('[AICHAT-DEBUG] Not playing welcome message:', {
        isFirstMount: isFirstMount.current,
        hasApiKey,
        hasPlayedWelcomeMessage
      });
    }
    
    // Clean up audio resources when component unmounts
    return () => {
      console.log("[AICHAT-DEBUG] AIChatComponent unmounting, cleaning up resources");
      
      // Mark component as unmounted to prevent state updates
      isMounted = false;
      
      // Clear the welcome message timeout if it exists
      if (welcomeTimer) {
        console.log("[AICHAT-DEBUG] Clearing welcome message timeout");
        clearTimeout(welcomeTimer);
      }
      
      // We no longer need to stop audio on unmount since AudioManager is persistent
      // This was causing the audio to stop during React StrictMode remounting
      console.log("[AICHAT-DEBUG] Component unmounted but not stopping audio to allow playback to continue");
    };
  }, [hasApiKey, say, stopCurrentAudio, isAudioPlaying, autoVoiceEnabled]);

  // -----------------------------------
  // (1) Smooth Scroll for Msg List updates
  // -----------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages, isTyping]);

  // Optional: see what user typed after a pause
  useEffect(() => {
    if (debouncedInput) {
      console.log("User paused typing:", debouncedInput);
    }
  }, [debouncedInput]);

  // -----------------------------------
  // (2) Smooth Scroll for user input interactions
  // -----------------------------------
  useEffect(() => {
    if (!chatInputAreaRef.current) return;

    // Always run at least once, even if userInput is empty
    requestAnimationFrame(() => {
      // 1) SCROLL the window itself
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });

      // 2) Then scroll the nearest scrollable parent
      const scrollableParent = findNearestScrollableParent(chatInputAreaRef.current);
      if (scrollableParent) {
        // Use small timeouts so layout can settle
        setTimeout(() => {
          scrollableParent.scrollTo({
            top: scrollableParent.scrollHeight,
            behavior: "smooth",
          });
        }, 40);

        // (Optional) A second pass to ensure no content shifts
        setTimeout(() => {
          scrollableParent.scrollTo({
            top: scrollableParent.scrollHeight,
            behavior: "smooth",
          });
        }, 200);
      }
    });
  }, [input]); // trigger every time the userInput changes

  // API response handling function with OpenAI
  const handleUserQuery = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages((prev) => [...prev, {text: input, type: MSG_USER}]);
    const currentInput = input; // Save the current input
    setInput(""); // Clear input field
    setIsTyping(true);
    
    try {
      // If we don't have an API key, fall back to simulated response
      if (!hasApiKey) {
        setTimeout(() => {
          setMessages((prev) => [...prev, {
            text: "Please add your OpenAI API key to enable AI responses.",
            type: MSG_AI
          }]);
          setIsTyping(false);
        }, 1000);
        return;
      }
      
      // Convert message history to OpenAI format
      const messageHistory: ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.type === MSG_USER ? "user" : "assistant",
        content: msg.text
      }));
      
      // Add system message at the beginning
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: "You are an AI assistant. Be concise, helpful and friendly."
      };
      
      // Add the current user message
      messageHistory.push({
        role: "user",
        content: currentInput
      });
      
      // Get AI response from OpenAI
      const aiResponse = await generateCompletion([systemMessage, ...messageHistory]);
      
      // Add AI response to message list
      setMessages((prev) => [...prev, {text: aiResponse, type: MSG_AI}]);
    } catch (error) {
      console.error('[CHAT] Error getting AI response:', error);
      // Handle error by showing error message
      setMessages((prev) => [...prev, {
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`,
        type: MSG_AI
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-lg overflow-hidden border border-[rgba(138,101,52,0.1)] min-h-[400px] h-full bg-black/20 backdrop-blur-sm ${className || ''}`}>
      <MessageList
        messages={messages}
        isTyping={isTyping}
        messageStyles={messageStyles}
        messagesEndRef={messagesEndRef}
      />
      <div ref={chatInputAreaRef} className="flex justify-center items-start py-4 min-h-[4rem] w-auto max-w-full">
        <div className="relative flex flex-col rounded-lg overflow-x-auto w-auto min-w-[16rem] max-w-full
          transition duration-300 px-5 py-2.5
          focus-within:ring-2 ring-blue-500/60 ring-offset-2 ring-offset-gray-900/70
          shadow-top-inset shadow-bottom shadow-2xl
          animate-colorCycleGlow input-focus-glow border border-black/50"
        >
          <ChatInput
            userInput={input}
            setUserInput={setInput}
            onSubmit={handleUserQuery}
          />
        </div>
      </div>
    </div>
  );
}