
'use server';

import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server';
import { cookies } from 'next/headers';
import UserProfileCollections from '@/components/UserProfileCollections'; // New client component

interface ProfilePageProps {
  params: {
    username: string;
  };
}

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfileType;
}

async function fetchUserProfile(username: string): Promise<UserProfileType | null> {
  console.log(`[UserProfilePage fetchUserProfile] Attempting to fetch profile for username: "${username}" using adminDb`);
  try {
    if (!adminDb) {
      console.error('[UserProfilePage fetchUserProfile] adminDb is not available. Firebase Admin SDK might not be initialized.');
      throw new Error('Server configuration error: Firebase Admin SDK not available.');
    }
    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`[UserProfilePage fetchUserProfile] No profile found for username: "${username}"`);
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    const userProfileData = { uuid: userDoc.id, ...userDoc.data() } as UserProfileType;
    console.log(`[UserProfilePage fetchUserProfile] Found profile for "${username}": UUID ${userProfileData.uuid}`);
    return userProfileData;
  } catch (error: any) {
    console.error(`[UserProfilePage fetchUserProfile] Error using adminDb for ${username}:`, error.message, error.code, error.stack);
    // Do not re-throw here to allow page to render with a "not found" state
    return null;
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const cookieStore = cookies(); // Ensures page is dynamically rendered
  const { username } = params;
  console.log(`[UserProfilePage] Rendering profile for username from params: "${username}"`);

  const currentUser = await getCurrentUser(cookieStore);
  const profileUser = await fetchUserProfile(username);

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
  console.log(`[UserProfilePage] isOwnProfile determined as: ${isOwnProfile} (currentUser UID: ${currentUser?.uid}, profileUser UUID: ${profileUser.uuid})`);

  return (
    <div className="space-y-10">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center p-6 sm:p-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 border-4 border-background shadow-md">
            <AvatarImage
              src={profileUser.profile_picture ?? undefined}
              alt={profileUser.profile_name}
              data-ai-hint="user profile large"
            />
            <AvatarFallback className="text-4xl">
              {profileUser.profile_name ? profileUser.profile_name.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl sm:text-4xl font-headline">{profileUser.profile_name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">@{profileUser.username}</CardDescription>
          {profileUser.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-prose whitespace-pre-wrap">{profileUser.bio || "No bio yet."}</p>
          )}
        </CardHeader>
        {/* Placeholder for ProfileImageUploader and ProfileBioEditor - will be re-added later if isOwnProfile is true */}
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
