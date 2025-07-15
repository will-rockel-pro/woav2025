
'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebaseServices();

  const handleSignOut = async () => {
    try {
      // Call the API route to clear the session cookie on the server
      const response = await fetch('/api/auth/session-logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server-side sign out failed:', errorData.error);
        // Proceed with client-side sign out anyway, but log the server error
      }

      // Perform client-side sign out
      await signOut(auth);
      
      toast({ title: 'Signed Out', description: "You have been successfully signed out."});
      router.push('/');
      router.refresh(); // Important to refresh server components
    } catch (error: any) {
      console.error('Error signing out: ', error);
      toast({
        title: 'Sign-out Failed',
        description: error.message || 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
      <LogOut className="mr-2 h-4 w-4" /> Sign Out
    </Button>
  );
}
