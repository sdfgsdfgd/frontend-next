"use client";

import React, { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import useDebounce from '../hooks/useDebounce';
import MessageList from './MessageList';
import '../globals.css';

type MessageType = 'user' | 'ai';
const MSG_USER: MessageType = 'user';
const MSG_AI: MessageType = 'ai';

const messageStyles: Record<MessageType, string> = {
  [MSG_USER]: 'bg-gray-700 self-end shadow-bottom',
  [MSG_AI]: 'bg-blue-500 text-white self-start shadow-top-inset shadow-bottom luxury-reflection hover-tilt'
};

export default function AIChatComponent() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<{ text: string, type: MessageType }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const debouncedInput = useDebounce(userInput, 444);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, isTyping]);
  useEffect(() => {
    if (debouncedInput) console.log('User paused typing:', debouncedInput);
  }, [debouncedInput]);

  const handleUserQuery = async () => {
    if (!userInput.trim()) return;
    setMessages(prev => [...prev, { text: userInput, type: MSG_USER }]);
    setUserInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Simulated AI response.", type: MSG_AI }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-end h-full relative">
      <MessageList messages={messages} isTyping={isTyping} messageStyles={messageStyles} messagesEndRef={messagesEndRef} />
      <div className="w-full flex justify-center items-center py-4">
        <div className="relative max-w-2xl w-full flex flex-col rounded-lg px-5 py-2.5 border border-gray-800/50 shadow-top-inset shadow-bottom overflow-hidden">
          <TextField
            variant="standard"
            fullWidth
            multiline
            rows={1}
            maxRows={6}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserQuery();
              }
            }}
            inputRef={inputRef}
            placeholder="Ask the AI"
            InputProps={{
              disableUnderline: true,
              style: {
                background: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 0 4px',
                fontFamily: 'inherit',
              },
            }}
            className="ml-2 luxury-input"
          />
        </div>
      </div>
    </div>
  );
}
