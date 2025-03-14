"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useOpenAI } from "../../context/OpenAIContext";
import { FaCheck, FaKey, FaSpinner, FaTimes, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';

interface ApiKeyCardProps {
  onClose: () => void;
}

export default function ApiKeyCard({ onClose }: ApiKeyCardProps) {
  const { apiKey, isKeyValid, isLoading, error, setApiKey, clearApiKey, say, isAudioPlaying, stopCurrentAudio } = useOpenAI();
  const [inputKey, setInputKey] = useState("");
  const [inputError, setInputError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const isMountedRef = useRef(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  
  // Initialize input value if we have a stored key
  useEffect(() => {
    if (apiKey) {
      // Mask API key display
      setInputKey(maskApiKey(apiKey));
    }
    
    return () => {
      // Mark as unmounted when component is destroyed
      isMountedRef.current = false;
      // Stop any audio playing when component unmounts
      stopCurrentAudio();
    };
  }, [apiKey, stopCurrentAudio]);
  
  // Mask the API key for display (show only first 4 chars)
  const maskApiKey = (key: string) => {
    if (!key) return "";
    const prefix = key.substring(0, 4);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${'•'.repeat(key.length - 8)}${suffix}`;
  };
  
  // Handle API key submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[APIKEYCARD-DEBUG] Submit API key button clicked');
    
    if (!inputKey.trim()) {
      console.log('[APIKEYCARD-DEBUG] No API key entered');
      setInputError("Please enter an API key");
      return;
    }

    // Show validation status
    setIsValidating(true);
    setInputError("");
    console.log('[APIKEYCARD-DEBUG] Starting API key validation');

    try {
      // Call the context function to set and validate the API key
      const isValid = await setApiKey(inputKey.trim());
      console.log('[APIKEYCARD-DEBUG] API key validation result:', { isValid });
      
      if (isValid && isMountedRef.current) {
        console.log('[APIKEYCARD-DEBUG] API key is valid, closing modal');
        onClose();
      } else {
        console.error('[APIKEYCARD-DEBUG] API key validation failed');
        if (isMountedRef.current) {
          setInputError("Failed to validate API key. Please check your key and try again.");
        }
      }
    } catch (error) {
      console.error('[APIKEYCARD-DEBUG] Error validating API key:', error);
      if (isMountedRef.current) {
        setInputError(error instanceof Error ? error.message : "Failed to validate API key");
      }
    } finally {
      if (isMountedRef.current) {
        setIsValidating(false);
      }
    }
  };
  
  // Handle clearing the API key
  const handleClear = () => {
    setInputKey("");
    clearApiKey();
    setInputError("");
  };
  
  // Play voice confirmation
  const handlePlayVoice = () => {
    if (isKeyValid && !isAudioPlaying && isMountedRef.current) {
      console.log('[ApiKeyCard] Playing test voice message');
      say("Hello! This is a test of the OpenAI text-to-speech API. Your API key is working correctly.")
        .catch(err => {
          console.error('[ApiKeyCard] Error playing test voice:', err);
          if (isMountedRef.current) {
            setInputError("Failed to play test voice. Please check your API key and try again.");
          }
        });
    }
  };
  
  // Function to demonstrate different voices
  const handleTestVoices = () => {
    if (!isKeyValid || isAudioPlaying || !isMountedRef.current) return;
    
    const voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
    const demoText = "This is the voice called";
    
    console.log('[ApiKeyCard] Starting voice demo sequence');
    
    say(`${demoText} ${voices[0]}.`, voices[0])
      .catch(err => {
        console.error('[ApiKeyCard] Error playing voice demo:', err);
        if (isMountedRef.current) {
          setInputError("Failed to play voice demo. Please check your API key and try again.");
        }
      });
  };
  
  // Test TTS functionality
  const testVoice = () => {
    console.log('[APIKEYCARD-DEBUG] Test voice button clicked');
    if (isAudioPlaying) {
      console.log('[APIKEYCARD-DEBUG] Stopping current audio');
      stopCurrentAudio();
    } else {
      console.log('[APIKEYCARD-DEBUG] Playing test message');
      say("Hello, I'm your AI assistant. Your API key is working correctly.")
        .then(() => {
          console.log('[APIKEYCARD-DEBUG] Test voice message completed');
        })
        .catch(err => {
          console.error('[APIKEYCARD-DEBUG] Error playing test voice message:', err);
        });
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md mx-auto relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <div className="text-center mb-6">
        <div className="flex justify-center items-center mb-2">
          <div className="bg-blue-500/20 p-3 rounded-full">
            <FaKey className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-1">OpenAI API Key</h2>
        <p className="text-gray-400 text-sm">Enter your OpenAI API key to enable AI features</p>
      </div>
      
      {/* Status indicator */}
      {apiKey && (
        <div className={`mb-4 p-2 rounded-md flex items-center justify-between ${isKeyValid ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
          {isKeyValid ? (
            <>
              <span className="flex items-center">
                <FaCheck className="mr-2" /> API key validated
              </span>
              <div className="flex">
                {isAudioPlaying ? (
                  <button
                    onClick={stopCurrentAudio}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                    title="Stop audio playback"
                    aria-label="Stop audio playback"
                  >
                    <FaSpinner className="animate-spin mr-1" />
                    <FaVolumeMute />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handlePlayVoice}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 mr-2"
                      aria-label="Test voice"
                      title="Test single voice"
                      disabled={isAudioPlaying}
                    >
                      <FaVolumeDown />
                    </button>
                    <button 
                      onClick={handleTestVoices}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                      aria-label="Test all voices"
                      title="Test all voice options"
                      disabled={isAudioPlaying}
                    >
                      <FaVolumeDown className="mr-1" />+
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <span className="flex items-center">
              <FaTimes className="mr-2" /> Invalid API key
            </span>
          )}
        </div>
      )}
      
      {/* Error message */}
      {(error || inputError) && (
        <div className="mb-4 p-2 rounded-md bg-red-900/20 text-red-400">
          {error || inputError}
        </div>
      )}
      
      {/* API Key input */}
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">
          API Key
        </label>
        <div className="relative">
          <input
            id="apiKey"
            type={showKey ? "text" : "password"}
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="sk-..."
            className="w-full p-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-500 focus:ring focus:ring-blue-500/30 focus:outline-none"
            style={{ paddingRight: "2.5rem" }}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-gray-400 hover:text-white focus:outline-none pointer-events-auto"
            >
              {showKey ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your API key is stored locally and never sent to our servers
        </p>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleClear}
          className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isLoading || isValidating}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          disabled={isLoading || isValidating}
        >
          {isLoading || isValidating ? (
            <FaSpinner className="animate-spin h-5 w-5" />
          ) : apiKey ? (
            "Update Key"
          ) : (
            "Save Key"
          )}
        </button>
      </div>
      
      {/* Help text */}
      <div className="mt-6 text-xs text-gray-500">
        <p>
          Need an OpenAI API key?{" "}
          <a
            href="https://platform.openai.com/account/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Get one here
          </a>
        </p>
      </div>
    </div>
  );
} 