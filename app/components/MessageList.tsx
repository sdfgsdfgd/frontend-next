"use client";

import React, { RefObject } from 'react';
import { List, ListItem, ListItemText } from '@mui/material';

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

      {/* This div ensures we can scroll into view */}
      <div ref={messagesEndRef}/>
    </List>
  );
}
