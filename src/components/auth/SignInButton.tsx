
'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
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
    console.log('[SignInButton] Initiating Google Sign-In...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('[SignInButton] Google Sign-In successful. User UID:', user?.uid);

      if (user) {
        const idToken = await user.getIdToken(true);
        console.log('[SignInButton] ID token obtained (first 10 chars):', idToken.substring(0,10) + '...');

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          console.log('[SignInButton] User profile does not exist. Creating new profile...');
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
          console.log('[SignInButton DEBUG] New user profile created in Firestore for UID:', user.uid);

          // Create a default "Reading List" collection for new user
          const readingListCollectionData = {
            title: "Reading List",
            description: "A place to save articles and links to read later.",
            owner: user.uid,
            published: false, // Default to private
            collaborators: [],
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
            image: '', // No default image
          };
          const readingListDocRef = await addDoc(collection(db, "collections"), readingListCollectionData);
          console.log(`[SignInButton DEBUG] "Reading List" collection created for user ${user.uid}. Document ID: ${readingListDocRef.id}`);
          
          toast({ title: "Welcome!", description: "Your profile and 'Reading List' collection have been created." });
        } else {
          console.log('[SignInButton] Existing user profile found.');
          toast({ title: "Welcome back!" });
        }

        console.log('[SignInButton] Calling /api/auth/session-login...');
        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[SignInButton] API call to /api/auth/session-login FAILED. Status:', response.status, 'Error:', errorData.error);
          throw new Error(errorData.error || 'Failed to create session.');
        } else {
          const responseData = await response.json();
          console.log('[SignInButton] API call to /api/auth/session-login SUCCEEDED. Status:', response.status, 'Response Data:', responseData);
        }
        
        console.log('[SignInButton] Pushing to /discover and refreshing router...');
        router.push('/discover');
        router.refresh(); 
      }
    } catch (error: any) {
      console.error('[SignInButton] Error during sign-in process:', error.message, error.code ? `(Code: ${error.code})` : '', error.stack);
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
