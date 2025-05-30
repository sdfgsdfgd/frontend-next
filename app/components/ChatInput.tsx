"use client";

import React, { FormEvent, KeyboardEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | HTMLDivElement>;
}

const DEFAULT_CARET = {left: 4, top: 6};

export default function ChatInput({userInput, setUserInput, onSubmit, placeholder = "Ask the AI ✨", disabled = false, inputRef}: ChatInputProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [caretPosition, setCaretPosition] = useState(DEFAULT_CARET);
  const [isJSActive, setIsJSActive] = useState(false);

  // Mark JS as active after mount
  useEffect(() => {
    setIsJSActive(true);
  }, []);

  // Connect the contentEditableRef to the external inputRef if provided
  useEffect(() => {
    if (inputRef && contentEditableRef.current) {
      // @ts-ignore - This is intentional to connect the refs
      inputRef.current = contentEditableRef.current;
    }
  }, [inputRef, contentEditableRef.current]);

  // Keep the DOM content in sync with `userInput` if needed
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.textContent !== userInput) {
      // can this cause cursor jumps if done after each keystroke ?
      contentEditableRef.current.textContent = userInput;
    }
  }, [userInput]);

  // Helper to compute the new caret position
  const calculateCaretPosition = useCallback(() => {
    const el = contentEditableRef.current;
    if (!el) return DEFAULT_CARET;

    // If input is empty or we have no selection, place caret at the default
    if (!userInput) return DEFAULT_CARET;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return DEFAULT_CARET;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const parentRect = el.getBoundingClientRect();

    // If the selection is out of bounds or collapsed, fallback
    if (rect.width === 0 && rect.height === 0) return DEFAULT_CARET;

    return {
      left: rect.left - parentRect.left,
      top: rect.top - parentRect.top
    };
  }, [userInput]);

  // Updates the caret position from our helper
  const updateCaretPosition = useCallback(() => {
    setCaretPosition(calculateCaretPosition());
  }, [calculateCaretPosition]);

  // On focus/blur, track state
  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    // Let the DOM settle, then set caret
    setTimeout(updateCaretPosition, 10);

    // Forward focus to external ref if provided
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Listen for selection changes while focused
  useEffect(() => {
    if (!isFocused) return;

    const handleSelectionChange = () => {
      updateCaretPosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isFocused, updateCaretPosition]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Sync userInput from contentEditable
  const handleInput = (e: FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    setUserInput(e.currentTarget.textContent || "");
  };

  // Clicking on container focuses the contentEditable
  const handleContainerClick = () => {
    if (disabled) return;
    if (contentEditableRef.current) {
      contentEditableRef.current.focus();
      setTimeout(updateCaretPosition, 10);
    }
  };

  return (
    <div
      className={`relative w-auto max-w-full min-w-[100px] px-2 py-2 cursor-text ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      onClick={handleContainerClick}
    >
      <div className="custom-caret-container relative">
        <div
          className={`
            luxury-input px-3 py-2 text-[var(--elegant-gold)] outline-none bg-none
            w-auto max-w-full min-w-[120px] custom-caret
            ${isJSActive ? "js-active" : ""}
            ${disabled ? "pointer-events-none" : ""}
          `}
          ref={contentEditableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            display: "inline-block",
            opacity: 0.85,
            textShadow: "var(--elegant-text-shadow)"
          }}
        />

        {/* Custom caret element - only displayed if JS is active */}
        {isFocused && isJSActive && !disabled && (
          <div
            className="pointer-events-none absolute animate-caretBlink"
            style={{
              left: `${caretPosition.left}px`,
              top: `${caretPosition.top}px`,
              width: "var(--caret-width)",
              height: "var(--caret-height)",
              background:
                "linear-gradient(to bottom, transparent 0%, var(--caret-color) 20%, var(--caret-color) 80%, transparent 100%)",
              boxShadow:
                "0 0 4px 1px var(--caret-glow), 0 0 8px 2px var(--caret-glow-strong)",
              animation:
                "caretBlink var(--caret-blink-speed) infinite ease-in-out, caretGlow 2s infinite alternate ease-in-out",
              opacity: 0.8
            }}
          />
        )}

        {/* Placeholder when unfocused & empty */}
        {!isFocused && !userInput && (
          <div className="pointer-events-none text-[var(--elegant-gold-dim)] absolute top-2 left-4">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
