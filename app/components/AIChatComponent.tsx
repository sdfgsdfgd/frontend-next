"use client";

import React, { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { List, ListItem, ListItemText } from '@mui/material';
import useDebounce from '../hooks/useDebounce';
import '../globals.css';

// Message type definitions
type MessageType = 'user' | 'ai';

// Message type constants
const MSG_USER: MessageType = 'user';
const MSG_AI: MessageType = 'ai';

// Message styling objects for reuse
const messageStyles: Record<MessageType, string> = {
  [MSG_USER]: 'bg-gray-700 self-end shadow-bottom',
  [MSG_AI]: 'bg-blue-500 text-white self-start shadow-top-inset shadow-bottom luxury-reflection hover-tilt'
};

export default function AIChatComponent() {
  const [userInput, setUserInput] = useState('');
  const debouncedInput = useDebounce(userInput, 444);
  // Store messages with type for better rendering logic
  const [messages, setMessages] = useState<{ text: string, type: MessageType }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input field on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages, isTyping]);

  useEffect(() => {
    if (debouncedInput) {
      console.log('User paused typing:', debouncedInput);
    }
  }, [debouncedInput]);

  const handleUserQuery = async () => {
    if (!userInput.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {text: userInput, type: MSG_USER}]);
    setUserInput('');
    setIsTyping(true);

    // Simulate a delay for demo purposes
    setTimeout(() => {
      try {
        // Simulated response
        setMessages(prev => [...prev, {
          text: "This is a simulated response since the actual endpoint is not available.",
          type: MSG_AI
        }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, {
          text: error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred',
          type: MSG_AI
        }]);
      } finally {
        setIsTyping(false);
      }
    }, 1500);
  };

  // Common TextField props to reduce duplication
  const textFieldProps = {
    variant: "standard" as const,
    fullWidth: true,
    placeholder: "Ask the AI",
    value: userInput,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && handleUserQuery(),
    InputProps: {
      disableUnderline: true,
      style: {
        backgroundColor: 'transparent',
        color: 'rgba(255, 255, 255, 0.95)',
        padding: '2px 0',
        fontFamily: 'inherit',
        fontWeight: 400,
        letterSpacing: '0.01em',
        textShadow: '0 0 1px rgba(150, 150, 150, 0.1)',
      },
      className: "luxury-input",
    },
    inputProps: {
      className: "text-sm luxury-text luxury-input",
      style: {
        fontFamily: 'inherit',
        caretColor: 'rgba(79, 190, 255, 0.9)',
      },
      ref: inputRef,
      placeholder: "What's on your mind?",
    },
    InputLabelProps: {
      style: {
        color: 'rgba(200, 200, 200, 0.8)',
        fontFamily: 'inherit',
        fontWeight: 300,
      }
    },
    className: "ml-2"
  };

  // Common container classes with a slightly different background for better visibility
  const containerClasses = `
    relative max-w-2xl w-full flex items-center rounded-full 
    transition duration-300 px-5 py-2.5 
    
    shadow-bright shadow-top-inset shadow-bottom
    
    glass-panel 
    animate-colorCycleGlow 
    
    focus-within:ring-2 ring-blue-500/60 ring-offset-2 ring-offset-gray-900/70
    border border-gray-800/50 input-focus-glow 
    overflow-hidden
  `;
  // Disabled / Removed:
  //
  // radial-shimmer
  // animate-shimmer
  //

  return (
    <div className="flex-1 flex flex-col justify-end h-full relative">
      {/* MESSAGE LIST */}
      <List className="overflow-auto px-3 flex-1">
        {messages.map((message, index) => (
          <ListItem
            key={index}
            className={`max-w-3/4 mb-2 p-2 rounded-lg animate-fade-in ${messageStyles[message.type]}`}
            style={{opacity: 0, animation: 'fadeInDown 0.5s ease forwards'}}
          >
            <ListItemText
              primary={message.text}
              primaryTypographyProps={{
                className: "luxury-text luxury-input",
                style: {fontFamily: 'inherit'}
              }}
            />
          </ListItem>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <ListItem className="self-start">
            <div className="typing-indicator animate-fade-in">
              <span></span><span></span><span></span>
            </div>
          </ListItem>
        )}

        <div ref={messagesEndRef}/>
      </List>

      {/* FLOATING INPUT (GLASS ISLAND) */}
      <div className="w-full flex justify-center items-center py-4">
        <div className={containerClasses}>
          <TextField {...textFieldProps} />

          {/* SUBMIT BUTTON inside the bubble */}
          <Button
            onClick={handleUserQuery}
            className="ml-3 rounded-full bg-blue-600/90 hover:bg-blue-500/90 text-sm font-medium text-white/95 px-4 py-1 normal-case shadow luxury-button-text hover-tilt luxury-button"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
