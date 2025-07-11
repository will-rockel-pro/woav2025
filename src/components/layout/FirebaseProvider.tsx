
'use client';

import { createContext, useContext } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import { initializeAppIfNeeded } from '@/lib/firebase';

// Create a context to hold the Firebase config
const FirebaseContext = createContext<FirebaseOptions | null>(null);

// Custom hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// The provider component
export default function FirebaseProvider({
  config,
  children,
}: {
  config: FirebaseOptions;
  children: React.ReactNode;
}) {
  // Initialize Firebase on the client with the provided config
  initializeAppIfNeeded(config);

  return (
    <FirebaseContext.Provider value={config}>
      {children}
    </FirebaseContext.Provider>
  );
}
