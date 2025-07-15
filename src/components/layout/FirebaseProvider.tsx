
'use client';

import { createContext, useContext } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import { initializeAppIfNeeded } from '@/lib/firebase';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Firebase on the client with the provided config
  initializeAppIfNeeded(firebaseConfig);

  return (
    <FirebaseContext.Provider value={firebaseConfig}>
      {children}
    </FirebaseContext.Provider>
  );
}
