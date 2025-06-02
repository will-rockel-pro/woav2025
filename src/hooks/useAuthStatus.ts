// src/hooks/useAuthStatus.ts
"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthStatus {
  user: FirebaseUser | null | undefined;
  loading: boolean;
  error: Error | undefined;
}

export function useAuthStatus(): AuthStatus {
  const [user, loading, error] = useAuthState(auth);
  return { user, loading, error };
}
