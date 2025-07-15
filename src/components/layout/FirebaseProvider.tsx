
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage, getGoogleAuthProvider } from '@/lib/firebase';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { GoogleAuthProvider } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseContextValue {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const useFirebaseServices = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider');
  }
  return context;
};

export default function FirebaseProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: FirebaseOptions;
}) {
  const [services, setServices] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    if (!config?.apiKey || config.apiKey.includes('YOUR_')) {
        console.error("Firebase config is missing or invalid in FirebaseProvider.");
        return;
    }

    const app = getFirebaseApp(config);
    const auth = getFirebaseAuth(app);
    const db = getFirebaseDb(app);
    const storage = getFirebaseStorage(app);
    const googleProvider = getGoogleAuthProvider();

    setServices({ app, auth, db, storage, googleProvider });
  }, [config]);

  if (!services) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4 text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-[250px]" />
                <p className="text-sm text-muted-foreground">Initializing Firebase...</p>
            </div>
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}
