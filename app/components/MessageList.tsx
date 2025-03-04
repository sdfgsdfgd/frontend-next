"use client";

import React, { RefObject } from 'react';

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

export default function MessageList({
                                      messages,
                                      isTyping,
                                      messageStyles,
                                      messagesEndRef
                                    }: MessageListProps) {
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
          <span className="luxury-text luxury-input text-sm sm:text-base">
            {message.text}
          </span>
        </div>
      ))}

      {isTyping && (
        <div className="w-fit max-w-[80%] self-start p-2 rounded-xl bg-white/10 backdrop-blur-md">
          <div className="flex space-x-1 items-center typing-indicator">
            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-75"></span>
            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce delay-150"></span>
          </div>
        </div>
      )}

      {/* Always scroll to here */}
      <div ref={messagesEndRef}/>
    </div>
  );
}
