"use client";

import React, { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  onSubmit: () => void;
}

export default function ChatInput({userInput, setUserInput, onSubmit}: ChatInputProps) {
  const inputRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caretPosition, setCaretPosition] = useState({ left: 0, top: 0 });
  const [isJSActive, setIsJSActive] = useState(false);

  // Mark JS as active after mount
  useEffect(() => {
    setIsJSActive(true);
  }, []);

  // On mount or userInput changes, we might want to sync the DOM
  useEffect(() => {
    // If we truly want to keep the DOM in sync, do something like:
    if (inputRef.current && inputRef.current.textContent !== userInput) {
      inputRef.current.textContent = userInput;
    }
    // But be aware this can still cause cursor jumps if done after each keystroke.
  }, [userInput]);

  // Track caret position changes
  useEffect(() => {
    const updateCaretPosition = () => {
      if (!isFocused) return;
      
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (inputRef.current) {
        const inputRect = inputRef.current.getBoundingClientRect();
        setCaretPosition({ 
          left: rect.left - inputRect.left, 
          top: rect.top - inputRect.top 
        });
      }
    };

    // Update position on various events
    document.addEventListener('selectionchange', updateCaretPosition);
    window.addEventListener('resize', updateCaretPosition);
    
    // Initial update
    updateCaretPosition();
    
    return () => {
      document.removeEventListener('selectionchange', updateCaretPosition);
      window.removeEventListener('resize', updateCaretPosition);
    };
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setUserInput(e.currentTarget.textContent || "");
  };

  // Handle container click to focus input
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  };

  // Handle focus events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    // Make entire container clickable
    <div 
      className="relative w-auto max-w-full min-w-[100px] px-2 py-2 cursor-text"
      onClick={handleContainerClick}
    >
      {/* Contenteditable div with custom caret */}
      <div
        className="custom-caret-container relative"
      >
        <div
          className={`
            luxury-input px-3 py-2 text-[var(--elegant-gold)] outline-none bg-none
            w-auto max-w-full min-w-[120px] custom-caret
            ${isJSActive ? 'js-active' : ''}
          `}
          contentEditable
          suppressContentEditableWarning
          ref={inputRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            display: "inline-block",
            opacity: 0.85,
            textShadow: 'var(--elegant-text-shadow)'
          }}
        />
        
        {/* Custom caret element - only displayed if JS is active */}
        {isFocused && isJSActive && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${caretPosition.left}px`,
              top: `${caretPosition.top}px`,
              width: 'var(--caret-width)',
              height: 'var(--caret-height)',
              background: 'linear-gradient(to bottom, transparent 0%, var(--caret-color) 20%, var(--caret-color) 80%, transparent 100%)',
              boxShadow: '0 0 4px 1px var(--caret-glow), 0 0 8px 2px var(--caret-glow-strong)',
              animation: 'caretBlink var(--caret-blink-speed) infinite ease-in-out, caretGlow 2s infinite alternate ease-in-out',
              opacity: 0.8
            }}
          />
        )}
        
        {/* Placeholder - only shown when not focused and empty */}
        {(!isFocused && (!userInput || userInput.length === 0)) && (
          <div className="pointer-events-none text-[var(--elegant-gold-dim)] absolute top-2 left-4">
            Ask the AI ✨
          </div>
        )}
      </div>
    </div>
  );
}
