"use client";

import { createContext } from "react";

// Modal control context to be used throughout the app
interface ModalControlContextType {
  isAuthModalOpen: boolean;
  isWorkspaceSelectorOpen: boolean;
  isApiKeyModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  setWorkspaceSelectorOpen: (isOpen: boolean) => void;
  setApiKeyModalOpen: (isOpen: boolean) => void;
}

export const ModalControlContext = createContext<ModalControlContextType>({
  isAuthModalOpen: false,
  isWorkspaceSelectorOpen: false,
  isApiKeyModalOpen: false,
  setAuthModalOpen: () => {},
  setWorkspaceSelectorOpen: () => {},
  setApiKeyModalOpen: () => {},
}); 