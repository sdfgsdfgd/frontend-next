"use client";

import { useOpenAI as useOpenAIContext } from '../context/OpenAIContext';

export default function useOpenAI() {
  return useOpenAIContext();
} 