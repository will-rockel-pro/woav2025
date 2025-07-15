
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import { initializeAppIfNeeded } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      // Initialize Firebase on the client with the provided config
      initializeAppIfNeeded(firebaseConfig);
      setInitialized(true);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }, []);

  if (!initialized) {
    // You can return a loading spinner or a skeleton UI here
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={firebaseConfig}>
      {children}
    </FirebaseContext.Provider>
  );
}
