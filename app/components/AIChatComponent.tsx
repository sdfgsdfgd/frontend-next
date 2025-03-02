'use client';

import React, {useEffect, useRef, useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {List, ListItem, ListItemText} from '@mui/material';
import '../globals.css';


export default function AIChatComponent() {
    const [userInput, setUserInput] = useState('');
    const [aiResponse, setAiResponse] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(scrollToBottom, [aiResponse]);

    const handleUserQuery = async () => {
        if (!userInput.trim()) return; // Prevent empty queries

        try {
            // const response = await fetch('http://localhost/api/test', {
            //todo If this works, replace with gpt and it'll work perfectly
            const response = await fetch('/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({userInput: userInput}),
            });

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                setAiResponse([...aiResponse, `Error: HTTP ${response.status}`]);
                return; // Stop further execution
            }

            const responseData = await response.text();

            setAiResponse([...aiResponse, responseData]);
        } catch (error: unknown) {
            let errorMessage = 'An unknown error occurred';
            if (error instanceof Error) {
                console.error('Error fetching response:', error);
                errorMessage = `Error: ${error.message}`;
            }

            setAiResponse([...aiResponse, errorMessage]);
        }

        setAiResponse([...aiResponse, userInput]);
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
                            style={{opacity: 0, animation: 'fadeInDown 0.5s ease forwards'}}
                        >
                            <ListItemText primary={response}/>
                        </ListItem>
                    );
                })}
                <div ref={messagesEndRef}/>
            </List>

            {/* FLOATING INPUT (GLASS ISLAND) */}
            <div className="w-full flex justify-center items-center py-4">
                <div className="bg-black/40 backdrop-blur-md rounded-full flex items-center px-4 py-2 max-w-2xl w-full">
                    <TextField
                        fullWidth
                        placeholder="Ask the AI"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUserQuery()}
                        variant="outlined"
                        InputProps={{
                            style: {
                                backgroundColor: 'transparent',
                                color: '#fff',
                            }
                        }}
                        InputLabelProps={{
                            style: {color: '#ccc'}
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.5)'
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#fff'
                            },
                            '& .MuiOutlinedInput-input': {
                                color: '#fff'
                            },
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUserQuery}
                        className="ml-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-full"
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
}

