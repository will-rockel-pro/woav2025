
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SignOutButton from '@/components/auth/SignOutButton';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, LogIn, PlusCircle, User, Library, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export default function UserNav() {
  const { user, loading: authLoading } = useAuthStatus();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      const fetchUserProfile = async () => {
        setProfileLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          } else {
            console.warn('User profile not found in Firestore for UID:', user.uid);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        } finally {
          setProfileLoading(false);
        }
      };
      fetchUserProfile();
    } else if (!user && !authLoading) {
      setUserProfile(null); 
    }
  }, [user, authLoading]);

  if (authLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/auth/signin">
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Link>
      </Button>
    );
  }

  const displayName = user.displayName || 'User';
  const displayEmail = user.email || 'No email';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={displayName} data-ai-hint="user avatar" />
            <AvatarFallback>
              {displayName ? displayName.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profileLoading && (
          <DropdownMenuItem disabled>
             <Skeleton className="h-4 w-4 mr-2" />
             <Skeleton className="h-4 w-24" />
          </DropdownMenuItem>
        )}
        {!profileLoading && userProfile && (
          <DropdownMenuItem asChild>
            <Link href={`/profile/${userProfile.username}`} className="w-full justify-start flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" /> My Profile
            </Link>
          </DropdownMenuItem>
        )}
        {!profileLoading && !userProfile && user && (
           <DropdownMenuItem disabled className="w-full justify-start flex items-center">
             <User className="mr-2 h-4 w-4" /> My Profile (Unavailable)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/discover" className="w-full justify-start flex items-center cursor-pointer">
            <Library className="mr-2 h-4 w-4" /> My Collections
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/create-collection" className="w-full justify-start flex items-center cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Collection
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          {/* SignOutButton already includes LogOut icon and text */}
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
