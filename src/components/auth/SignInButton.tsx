
'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth, db, googleProvider } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function SignInButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user) {
        const idToken = await user.getIdToken(true);

        // Create user profile in Firestore if it doesn't exist
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const baseUsername = (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/gi, '');
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const username = `${baseUsername}${randomSuffix}`;
          
          const newUserProfile: UserProfile = {
            uuid: user.uid,
            username: username,
            profile_name: user.displayName || 'Anonymous User',
            profile_picture: user.photoURL || null,
          };
          await setDoc(userRef, newUserProfile);
          toast({ title: "Welcome!", description: "Your profile has been created." });
        } else {
          toast({ title: "Welcome back!" });
        }

        // Send ID token to server to create session cookie
        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create session.');
        }
        
        router.push('/discover');
        router.refresh(); // Important to refresh server components that rely on new session
      }
    } catch (error: any) {
      console.error('Error signing in with Google: ', error);
      toast({
        title: 'Sign-in Failed',
        description: error.message || 'Could not sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handleSignIn} variant="outline">
      <LogIn className="mr-2 h-4 w-4" /> Sign in with Google
    </Button>
  );
}
