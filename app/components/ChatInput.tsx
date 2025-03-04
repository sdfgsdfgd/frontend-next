"use client";

import React, { useEffect, useRef } from "react";

interface ChatInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  onSubmit: () => void;
}

export default function ChatInput({userInput, setUserInput, onSubmit}: ChatInputProps) {
  const inputRef = useRef<HTMLDivElement>(null);

  // On mount or userInput changes, we might want to sync the DOM
  useEffect(() => {
    // If we truly want to keep the DOM in sync, do something like:
    if (inputRef.current && inputRef.current.textContent !== userInput) {
      inputRef.current.textContent = userInput;
    }
    // But be aware this can still cause cursor jumps if done after each keystroke.
  }, [userInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setUserInput(e.currentTarget.textContent || "");
  };

  return (
    <div className="relative w-auto max-w-full min-w-[100px]">
      {/* Actual contentEditable div */}
      <div
        className="
          luxury-input px-3 py-2 text-white bg-transparent outline-none
          border border-gray-800/50 rounded-lg
          w-auto max-w-full
        "
        contentEditable
        suppressContentEditableWarning
        ref={inputRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{display: "inline-block"}}
      />

      {/* Placeholder layered behind or absolutely positioned */}
      {(!userInput || userInput.length === 0) && (
        <div className="pointer-events-none text-gray-400 absolute top-2 left-3">
          Ask the AI ✨
        </div>
      )}
    </div>
  );
}
