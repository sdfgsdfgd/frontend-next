"use client";

import React, { useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "../globals.css";

type MessageType = "user" | "ai";
const MSG_USER: MessageType = "user";
const MSG_AI: MessageType = "ai";

const messageStyles: Record<MessageType, string> = {
  [MSG_USER]: `
    bg-gradient-to-r from-gray-700 to-gray-900 
    text-white
    shadow-xl shadow-black/50
    border border-white/10
    backdrop-blur-sm
    self-end
    hover:scale-[1.01]
    transition
    duration-300
  `,
  [MSG_AI]: `
    bg-gradient-to-r from-transparent to-gray-800 to-transparent
    text-white
    shadow-2xl shadow-blue-800/50
    border border-white/20
    backdrop-blur-sm
    self-start
    animate-colorCycleGlow
    hover:scale-[1.01]
    transition
    duration-300
  `
};

export default function AIChatComponent() {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; type: MessageType }[]>([]);
  const [isTyping, setAILoading] = useState(false);
  const debouncedInput = useDebounce(userInput, 444);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);

  // Debug log on mount
  useEffect(() => {
    console.log('[CHAT] AIChatComponent mounted');
    return () => {
      console.log('[CHAT] AIChatComponent unmounted');
    };
  }, []);

  useEffect(() => messagesEndRef.current?.scrollIntoView({behavior: "smooth"}), [messages, isTyping]);
  useEffect(() => {
    if (debouncedInput) console.log("User paused typing:", debouncedInput);
  }, [debouncedInput]);

  const handleUserQuery = async () => {
    if (!userInput.trim()) return;
    setMessages((prev) => [...prev, {text: userInput, type: MSG_USER}]);
    setUserInput("");
    setAILoading(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, {text: "Simulated AI response.", type: MSG_AI}]);
      setAILoading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-end w-full h-full relative">
      <MessageList 
        messages={messages}
        isTyping={isTyping}
        messageStyles={messageStyles}
        messagesEndRef={messagesEndRef}
      />
      <div 
        ref={chatInputAreaRef}
        className="flex justify-center items-start py-4 min-h-[4rem] w-auto max-w-full"
      >
        <div className="relative flex flex-col rounded-lg overflow-x-auto w-auto max-w-full
          transition duration-300 px-5 py-2.5
          focus-within:ring-2 ring-blue-500/60 ring-offset-2 ring-offset-gray-900/70
          shadow-top-inset shadow-bottom shadow-2xl
          animate-colorCycleGlow input-focus-glow border border-gray-800/50"
        >
          <ChatInput 
            userInput={userInput}
            setUserInput={setUserInput}
            onSubmit={handleUserQuery}
          />
        </div>
      </div>
    </div>
  );
}
