"use client";

import React, { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { List, ListItem, ListItemText } from '@mui/material';
import useDebounce from '../hooks/useDebounce';
import '../globals.css';

export default function AIChatComponent() {
  const [userInput, setUserInput] = useState('');
  const debouncedInput = useDebounce(userInput, 444);
  const [aiResponse, setAiResponse] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiResponse]);

  // Example of using the debounced input
  useEffect(() => {
    if (debouncedInput) {
      // Possibly trigger a partial fetch or preview logic
      console.log('User paused typing:', debouncedInput);
    }
  }, [debouncedInput]);

  const handleUserQuery = async () => {
    if (!userInput.trim()) return;

    // Example fetch (replace with real endpoint)
    try {
      const response = await fetch('http://sdfgsdfg.net/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        setAiResponse(prev => [...prev, `Error: HTTP ${response.status}`]);
        return;
      }

      const responseData = await response.text();
      setAiResponse(prev => [...prev, responseData]);
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        console.error('Error fetching response:', error);
        errorMessage = `Error: ${error.message}`;
      }
      setAiResponse(prev => [...prev, errorMessage]);
    }

    // Also append the user's message in the UI
    setAiResponse(prev => [...prev, userInput]);
    setUserInput('');
  };

  return (
    <div className="flex-1 flex flex-col justify-end h-full relative">
      {/* MESSAGE LIST */}
      <List className="overflow-auto px-3 flex-1">
        {aiResponse.map((response, index) => {
          const isUserMessage = index % 2 === 0;
          return (
            <ListItem
              key={index}
              className={`max-w-3/4 mb-2 p-2 rounded-lg animate-fade-in-down 
                ${isUserMessage ? 'bg-gray-700 self-end' : 'bg-blue-500 text-white self-start'}
              `}
              style={{ opacity: 0, animation: 'fadeInDown 0.5s ease forwards' }}
            >
              <ListItemText primary={response} />
            </ListItem>
          );
        })}
        <div ref={messagesEndRef} />
      </List>

      {/* FLOATING INPUT (GLASS ISLAND) */}
      <div className="w-full flex justify-center items-center py-4">
        <div
          className="
            relative
            max-w-2xl
            w-full
            flex
            items-center
            rounded-full
            bg-black/30
            backdrop-blur-md
            transition
            duration-300
            px-4
            py-1.5

            /* Subtle outer glow and animations */
            shadow-bright

            animate-slowToFastToSlow
            animate-colorCycleGlow
            {/*animate-shimmer*/}
            {/*luxury-reflection*/}

            /* On focus, highlight entire container (Tailwind ring classes) */
            focus-within:ring-2
            ring-blue-500
            ring-offset-2
            ring-offset-gray-900
          "
        >
          <TextField
            variant="standard"         /* Or "filled" for a slightly different style */
            fullWidth
            placeholder="Ask the AI"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserQuery()}
            InputProps={{
              disableUnderline: true,  // Removes MUI underline
              style: {
                backgroundColor: 'transparent',
                color: '#fff',
                padding: 0,
              },
            }}
            inputProps={{
              className: "text-sm", // Tailwind text sizing, if desired
            }}
            InputLabelProps={{
              style: { color: '#ccc' }
            }}
            className="ml-2"
          />

          {/* SUBMIT BUTTON inside the bubble */}
          <Button
            onClick={handleUserQuery}
            className="
              ml-3
              rounded-full
              bg-blue-600
              hover:bg-blue-700
              text-sm
              font-medium
              text-white
              px-4
              py-1
              normal-case
              shadow
            "
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
