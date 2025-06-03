
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use client-side db
import type { UserProfile as UserProfileType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import UserProfileCollections from '@/components/UserProfileCollections';
import { useAuthStatus } from '@/hooks/useAuthStatus'; // For client-side auth check
import { Skeleton } from '@/components/ui/skeleton';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { user: currentUser, loading: authLoading } = useAuthStatus();
  const [profileUser, setProfileUser] = useState<UserProfileType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) {
        setError("Username not found in URL.");
        setLoadingProfile(false);
        return;
      }
      console.log(`[UserProfilePage Client] Attempting to fetch profile for username: "${username}"`);
      setLoadingProfile(true);
      setError(null);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn(`[UserProfilePage Client] No profile found for username: "${username}"`);
          setProfileUser(null);
          setError("User not found.");
        } else {
          const userDoc = querySnapshot.docs[0];
          const userProfileData = {
            uuid: userDoc.id,
            ...userDoc.data()
          } as UserProfileType;
          setProfileUser(userProfileData);
          console.log(`[UserProfilePage Client] Found profile for "${username}": UUID ${userProfileData.uuid}`);
        }
      } catch (err: any) {
        console.error(`[UserProfilePage Client] Error fetching profile for ${username}:`, err);
        setError(err.message || "Failed to load profile.");
        setProfileUser(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (authLoading || loadingProfile) {
    return (
      <div className="space-y-10">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center p-6 sm:p-8">
            <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full mb-4" />
            <Skeleton className="h-10 w-3/4 max-w-xs mb-2" />
            <Skeleton className="h-6 w-1/2 max-w-xxs" />
          </CardHeader>
        </Card>
        <section>
          <div className="flex items-center mb-6">
            <Skeleton className="h-8 w-8 mr-3 rounded" />
            <Skeleton className="h-9 w-1/2 md:w-1/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg shadow-md p-4 space-y-3">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full mt-2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <UserCircle className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">Error Loading Profile</h1>
        <p className="text-lg text-muted-foreground">{error}</p>
      </div>
    );
  }
  
  if (!profileUser) {
     return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <UserCircle className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The profile for "@{username}" could not be found.
        </p>
      </div>
    );
  }

  const isOwnProfile = !!(currentUser && currentUser.uid === profileUser.uuid);

  return (
    <div className="space-y-10">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center p-6 sm:p-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 border-4 border-background shadow-md">
            <AvatarImage
              src={profileUser.profile_picture ?? undefined}
              alt={profileUser.profile_name}
              data-ai-hint="user profile placeholder"
            />
            <AvatarFallback className="text-4xl">
              {profileUser.profile_name ? profileUser.profile_name.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl sm:text-4xl font-headline">{profileUser.profile_name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">@{profileUser.username}</CardDescription>
        </CardHeader>
        {/* ProfileImageUploader and ProfileBioEditor would be conditionally rendered here if isOwnProfile is true, once re-added */}
      </Card>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center font-headline">
          <Library className="mr-3 h-8 w-8 text-primary" />
          {isOwnProfile ? "My Collections" : `Collections by ${profileUser.profile_name}`}
        </h2>
        <UserProfileCollections userId={profileUser.uuid} isOwnProfileView={isOwnProfile} profileOwnerName={profileUser.profile_name} />
      </section>
    </div>
  );
}
