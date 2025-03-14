"use client";

import React, { useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "../globals.css";

type MessageType = "user" | "ai";
const MSG_USER: MessageType = "user";
const MSG_AI: MessageType = "ai";

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

export default function AIChatComponent() {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<{ text: string; type: MessageType }[]>([]);
  const [isTyping, setAILoading] = useState(false);

  // Debounce example
  const debouncedInput = useDebounce(userInput, 444);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);

  // Debug log on mount
  useEffect(() => {
    console.log("[CHAT] AIChatComponent mounted");
    return () => console.log("[CHAT] AIChatComponent unmounted");
  }, []);

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
  }, [userInput]); // trigger every time the userInput changes

  // Fake AI response - connecting soon with Websocket via engine api
  const handleUserQuery = async () => {
    if (!userInput.trim()) return;
    setMessages((prev) => [...prev, {text: userInput, type: MSG_USER}]);
    setUserInput("");
    setAILoading(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, {text: "Simulated AI response.", type: MSG_AI}]);
      setAILoading(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col max-w-full h-full relative p-12">
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
            userInput={userInput}
            setUserInput={setUserInput}
            onSubmit={handleUserQuery}
          />
        </div>
      </div>
    </div>
  );
}