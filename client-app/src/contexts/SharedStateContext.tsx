import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context interface
interface SharedStateContextType {
  sharedValue: string;
  setSharedValue: (value: string) => void;
  counter: number;
  incrementCounter: () => void;
  decrementCounter: () => void;
}

// Create the context
const SharedStateContext = createContext<SharedStateContextType | undefined>(undefined);

// Provider component
interface SharedStateProviderProps {
  children: ReactNode;
}

export const SharedStateProvider: React.FC<SharedStateProviderProps> = ({ children }) => {
  const [sharedValue, setSharedValue] = useState('Initial Context Value');
  const [counter, setCounter] = useState(0);

  const incrementCounter = () => setCounter(prev => prev + 1);
  const decrementCounter = () => setCounter(prev => prev - 1);

  const value: SharedStateContextType = {
    sharedValue,
    setSharedValue,
    counter,
    incrementCounter,
    decrementCounter
  };

  return (
    <SharedStateContext.Provider value={value}>
      {children}
    </SharedStateContext.Provider>
  );
};

// Custom hook to use the context
export const useSharedState = (): SharedStateContextType => {
  const context = useContext(SharedStateContext);
  if (context === undefined) {
    throw new Error('useSharedState must be used within a SharedStateProvider');
  }
  return context;
}; 