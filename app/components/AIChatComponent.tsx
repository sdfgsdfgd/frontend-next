"use client";

import React, { useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "../globals.css";
import useContainer from "../hooks/useContainer";
import { ContainerStatus } from "../context/WebSocketContext";
import { Message, MessageType } from "./MessageList";

// Message type constants
const MSG_USER: MessageType = "user";
const MSG_AI: MessageType = "ai";
const MSG_SYSTEM: MessageType = "system";
const MSG_INPUT: MessageType = "input";

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
  `,
  system: `
    bg-gradient-to-r from-blue-900/30 to-blue-800/30
    text-blue-200
    shadow-lg shadow-blue-900/20
    border border-blue-700/30
    backdrop-blur-sm
    self-center
    hover:scale-[1.01]
    transition
    duration-300
    text-shadow
  `,
  input: `
    bg-gradient-to-r from-purple-900/30 to-purple-800/30
    text-purple-200
    shadow-lg shadow-purple-900/20
    border border-purple-700/30
    backdrop-blur-sm
    self-start
    hover:scale-[1.01]
    transition
    duration-300
    text-shadow
  `
};

// Map container status to human-readable text
const containerStatusText: Record<ContainerStatus, string> = {
  idle: "Ready to start",
  starting: "Starting container...",
  running: "Container running",
  input_needed: "Input required",
  error: "Container error",
  exited: "Container exited"
};

export default function AIChatComponent({className}: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isWaitingForResponse, setIsWaitingForResponse] = useState<boolean>(false);
  const debouncedInput = useDebounce(input, 300);

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement | HTMLDivElement>(null);

  // Container hook
  const { 
    status: containerStatus, 
    output: containerOutput, 
    error: containerError,
    isWaitingForInput,
    isRunning,
    startContainer,
    sendInput,
    stopContainer,
    resetContainer
  } = useContainer();

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: "smooth"});
    }
  }, [messages]);

  // Debug log on mount with welcome message
  useEffect(() => {
    console.log("[CONTAINER-CHAT-DEBUG] ContainerChatComponent mounted");
    console.log("[CONTAINER-CHAT-DEBUG] Container state:", {
      containerStatus,
      isWaitingForInput,
      isRunning
    });

    // Add welcome message on first mount if not already added
    if (messages.length === 0) {
      setMessages([{
        text: "Container terminal ready. Select a repository and click Start to begin.",
        type: MSG_SYSTEM
      }]);
      
      // Mark welcome message as played
      sessionStorage.setItem(SESSION_WELCOME_KEY, 'true');
    }
    
    // Clean up function
    return () => {
      console.log("[CONTAINER-CHAT-DEBUG] ContainerChatComponent unmounting");
    };
  }, []);

  // Monitor container output and update messages
  useEffect(() => {
    if (containerOutput.length === 0) return;
    
    // Get the latest output message
    const latestOutput = containerOutput[containerOutput.length - 1];
    
    console.log('[CONTAINER-CHAT-DEBUG] Processing output message:', {
      timestamp: latestOutput.timestamp,
      type: latestOutput.type,
      contentPreview: latestOutput.content.substring(0, 50) + (latestOutput.content.length > 50 ? '...' : ''),
      contentLength: latestOutput.content.length,
      currentMessagesCount: messages.length
    });
    
    // Check for input marker
    const hasInputMarker = latestOutput.content.includes('`````INPUT`````') || latestOutput.content.includes('`````INPUT');
    if (hasInputMarker) {
      console.log('[CONTAINER-CHAT-DEBUG] INPUT MARKER DETECTED in container output');
    }
    
    // Check if we already have this message (by content)
    const contentMatches = messages.filter(msg => msg.text === latestOutput.content);
    
    console.log('[CONTAINER-CHAT-DEBUG] Content-based duplicate check:', {
      matchesFound: contentMatches.length,
      isDuplicate: contentMatches.length > 0,
      lastMessagePreview: messages.length > 0 ? messages[messages.length-1].text.substring(0, 50) : 'no messages',
      hasInputMarker
    });
    
    // Only add if we don't already have this exact content
    if (contentMatches.length === 0) {
      // Map container output type to message type
      let messageType: MessageType;
      switch (latestOutput.type) {
        case 'input':
          messageType = MSG_USER;
          break;
        case 'error':
          messageType = MSG_SYSTEM;
          break;
        default:
          messageType = MSG_AI;
      }
      
      // Special handling for input requests
      if (latestOutput.type === 'input' || latestOutput.content.includes('`````INPUT`````') || latestOutput.content.includes('`````INPUT')) {
        messageType = MSG_INPUT;
      }
      
      // Message text is just the content
      const messageText = latestOutput.content;
      
      console.log('[CONTAINER-CHAT-DEBUG] Adding new UI message:', {
        type: messageType,
        contentPreview: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
      });
      
      // Add the new message
      setMessages(prev => [...prev, {
        text: messageText,
        type: messageType
      }]);
    } else {
      console.log('[CONTAINER-CHAT-DEBUG] Skipping duplicate message');
    }
  }, [containerOutput, messages]);

  // Monitor container status changes
  useEffect(() => {
    // Add status messages for important state transitions
    if (containerStatus === 'starting') {
      setMessages(prev => [...prev, {
        text: "Starting Arcana container...",
        type: MSG_SYSTEM
      }]);
      setIsWaitingForResponse(true);
    } 
    else if (containerStatus === 'running') {
      setIsWaitingForResponse(false);
    }
    else if (containerStatus === 'error' && containerError) {
      setMessages(prev => [...prev, {
        text: `Error: ${containerError}`,
        type: MSG_SYSTEM
      }]);
      setIsWaitingForResponse(false);
    }
    else if (containerStatus === 'exited') {
      setMessages(prev => [...prev, {
        text: "Container has exited",
        type: MSG_SYSTEM
      }]);
      setIsWaitingForResponse(false);
    }
    else if (containerStatus === 'input_needed') {
      setIsWaitingForResponse(false);
    }
  }, [containerStatus, containerError]);

  // -----------------------------------
  // (1) Smooth Scroll for Msg List updates
  // -----------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages, isWaitingForResponse]);

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

  // -----------------------------------
  // (3) Scroll when input area appears/disappears
  // -----------------------------------
  useEffect(() => {
    console.log('[CONTAINER-CHAT-DEBUG] isWaitingForInput changed to:', isWaitingForInput);
    
    // When input becomes required, scroll to make it visible
    if (isWaitingForInput) {
      console.log('[CONTAINER-CHAT-DEBUG] Attempting to scroll due to isWaitingForInput = true');
      
      // Focus the input element after a short delay to ensure it's rendered
      setTimeout(() => {
        if (chatInputRef.current) {
          console.log('[CONTAINER-CHAT-DEBUG] Focusing input element');
          chatInputRef.current.focus();
          
          // Use browser's native scrollIntoView behavior as a backup
          chatInputRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center' 
          });
        } else {
          console.log('[CONTAINER-CHAT-DEBUG] Input element ref is null');
        }
      }, 300);
      
      // Wait for 1 second before scrolling to ensure transitions are complete
      setTimeout(() => {
        console.log('[CONTAINER-CHAT-DEBUG] Running delayed scroll (1s)');
        
        // Schedule scroll for next frame to ensure DOM is updated
        requestAnimationFrame(() => {
          console.log('[CONTAINER-CHAT-DEBUG] Running scroll in requestAnimationFrame');
          
          // First scroll the window
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
          
          // Find and scroll the nearest scrollable parent
          if (messagesEndRef.current) {
            const scrollableParent = findNearestScrollableParent(messagesEndRef.current);
            if (scrollableParent) {
              console.log('[CONTAINER-CHAT-DEBUG] Found scrollable parent, scrolling to:', scrollableParent.scrollHeight);
              
              scrollableParent.scrollTo({
                top: scrollableParent.scrollHeight,
                behavior: "smooth",
              });
              
              // Additional scroll after transition starts
              setTimeout(() => {
                console.log('[CONTAINER-CHAT-DEBUG] Running 100ms delayed scroll');
                scrollableParent.scrollTo({
                  top: scrollableParent.scrollHeight,
                  behavior: "smooth",
                });
              }, 100);
              
              // Final scroll after transition nearly complete
              setTimeout(() => {
                console.log('[CONTAINER-CHAT-DEBUG] Running 400ms delayed scroll');
                scrollableParent.scrollTo({
                  top: scrollableParent.scrollHeight,
                  behavior: "smooth",
                });
              }, 400);
            } else {
              console.log('[CONTAINER-CHAT-DEBUG] No scrollable parent found for messagesEndRef');
            }
          } else {
            console.log('[CONTAINER-CHAT-DEBUG] messagesEndRef.current is null');
          }
        });
      }, 1000); // 1 second delay for scrolling
    }
  }, [isWaitingForInput]); // Only trigger when isWaitingForInput changes

  // Handle user input submission
  const handleUserQuery = async () => {
    // Modified to allow empty input when awaiting input
    if (!input.trim() && !isWaitingForInput) return;

    // If container is not running, start it
    if (!isRunning) {
      // Add user message
      setMessages(prev => [...prev, {text: input, type: MSG_USER}]);
      setInput(""); // Clear input field
      
      // Check if the input is a start command
      if (input.toLowerCase().includes('start')) {
        try {
          setIsWaitingForResponse(true);
          await startContainer();
          // Status change will be handled by the status effect
        } catch (error) {
          console.error("[CONTAINER-CHAT] Error starting container:", error);
          setMessages(prev => [...prev, {
            text: `Failed to start container: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: MSG_SYSTEM
          }]);
          setIsWaitingForResponse(false);
        }
      } else {
        // Just respond with a system message
        setMessages(prev => [...prev, {
          text: "Container is not running. Type 'start' to begin.",
          type: MSG_SYSTEM
        }]);
      }
      return;
    }
    
    // If container is waiting for input, send it
    if (isWaitingForInput) {
      // Add user message
      setMessages(prev => [...prev, {text: input, type: MSG_USER}]);
      const currentInput = input; // Save the current input
      setInput(""); // Clear input field
      
      try {
        setIsWaitingForResponse(true);
        await sendInput(currentInput);
        // Don't add any messages here, as the container output listener will do that
      } catch (error) {
        console.error("[CONTAINER-CHAT] Error sending input:", error);
        setMessages(prev => [...prev, {
          text: `Failed to send input: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: MSG_SYSTEM
        }]);
        setIsWaitingForResponse(false);
      }
      return;
    }
    
    // If container is running but not waiting for input, just add the message
    // and inform user that the container is not waiting for input
    setMessages(prev => [...prev, {text: input, type: MSG_USER}]);
    setInput(""); // Clear input field
    
    // Add system message
    setMessages(prev => [...prev, {
      text: "The container is not waiting for input at the moment.",
      type: MSG_SYSTEM
    }]);
  };

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden border border-[rgba(138,101,52,0.1)] min-h-[400px] h-full bg-black/20 backdrop-blur-sm ${className || ''}`}>
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-[rgba(138,101,52,0.2)]">
        <div className="text-[rgba(138,101,52,0.8)] text-sm font-mono">
          Container Status: <span className={`inline-block px-2 py-0.5 rounded ${
            containerStatus === 'error' ? 'bg-red-900/50 text-red-200' :
            containerStatus === 'running' ? 'bg-green-900/50 text-green-200' :
            containerStatus === 'input_needed' ? 'bg-yellow-900/50 text-yellow-200' :
            'bg-gray-900/50 text-gray-300'
          }`}>{containerStatusText[containerStatus]}</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              startContainer()
                .catch(err => console.error("[CONTAINER-CHAT] Error starting container:", err));
            }}
            disabled={isRunning}
            className="px-2 py-1 text-xs bg-blue-900/50 text-blue-200 rounded border border-blue-700/50 disabled:opacity-50"
          >
            Start
          </button>
          <button
            onClick={() => {
              stopContainer()
                .catch(err => console.error("[CONTAINER-CHAT] Error stopping container:", err));
            }}
            disabled={!isRunning}
            className="px-2 py-1 text-xs bg-red-900/50 text-red-200 rounded border border-red-700/50 disabled:opacity-50"
          >
            Stop
          </button>
        </div>
      </div>
      
      <MessageList
        messages={messages}
        isTyping={isWaitingForResponse}
        messageStyles={messageStyles}
        messagesEndRef={messagesEndRef}
      />
      
      {/* Only show input when waiting for input, with fade in/out effect */}
      <div className={`transition-all duration-500 ease-in-out ${isWaitingForInput ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden'}`}>
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
              placeholder="Enter your input..."
              disabled={isWaitingForResponse}
              inputRef={chatInputRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}