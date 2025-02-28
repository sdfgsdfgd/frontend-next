// AIChatComponent.tsx
import React, {useEffect, useRef, useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { List, ListItem, ListItemText } from '@mui/material';
import '../app/globals.css';


export default function AIChatComponent() {
    const [userInput, setUserInput] = useState('');
    const [aiResponse, setAiResponse] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [aiResponse]);

    const handleUserQuery = async () => {
        if (!userInput.trim()) return; // Prevent empty queries

        try {
            // const response = await fetch('http://localhost/api/test', {
            //todo If this works, replace with gpt and it'll work perfectly
            const response = await fetch('/api/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({userInput: userInput}),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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


        setUserInput(''); // Reset the input field
    };

    return (
        <div className="flex flex-col justify-end h-screen p-6 bg-gradient-to-b from-[rgb(var(--background-start-rgb))] to-[rgb(var(--background-end-rgb))]">
            <List className="overflow-auto px-3">
                {aiResponse.map((response, index) => {
                    // Determine if the message is from the user or AI for styling
                    const isUserMessage = index % 2 === 0; // Replace with your actual logic

                    return (
                        <ListItem
                            key={index}
                            className={`max-w-3/4 mb-2 p-2 rounded-lg  animate-fade-in-down shadow-inset transform transition-all duration-500 ${
                                isUserMessage ? 'bg-gray-700 self-end' : 'bg-blue-500 text-white self-start'
                            }`}
                            style={{ opacity: 0, animation: 'fadeInDown 0.5s ease forwards' }}
                        >
                            <ListItemText primary={response} />
                        </ListItem>
                    );
                })}
            </List>
            <div className="mt-4">
                <TextField
                    className="mb-4 bg-gray-800 text-white border border-gray-600"
                    fullWidth
                    label="Ask the AI"
                    variant="outlined"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUserQuery()}
                    InputLabelProps={{
                    className: "text-gray-400 mb-4"
                }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUserQuery}
                    fullWidth
                    className="bg-blue-600 shadow-bright transition duration-300 ease-in-out hover:bg-blue-700"
                    // className="transition duration-300 ease-in-out hover:bg-blue-700"
                >
                    Submit
                </Button>
            </div>
        </div>
    );
}

