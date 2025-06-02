'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Signed Out', description: "You have been successfully signed out."});
      router.push('/');
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
