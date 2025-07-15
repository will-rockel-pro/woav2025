
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb, getFirebaseStorage, getGoogleAuthProvider } from '@/lib/firebase';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { GoogleAuthProvider } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
}: {
  children: React.ReactNode;
}) {
  const [services, setServices] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    if (
      !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_') ||
      !firebaseConfig.projectId || firebaseConfig.projectId.includes('YOUR_')
    ) {
      console.warn("Firebase config is missing or invalid. Firebase will not be initialized.");
      return;
    }
    
    const app = getFirebaseApp(firebaseConfig);
    const auth = getFirebaseAuth(app);
    const db = getFirebaseDb(app);
    const storage = getFirebaseStorage(app);
    const googleProvider = getGoogleAuthProvider();

    setServices({ app, auth, db, storage, googleProvider });
  }, []);

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
