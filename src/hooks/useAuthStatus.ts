
// src/hooks/useAuthStatus.ts
"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthStatus {
  user: FirebaseUser | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useAuthStatus(): AuthStatus {
  // Get the initialized auth instance from our provider.
  const { auth } = useFirebaseServices();
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}
