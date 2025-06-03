
'use server';

import { cookies } from 'next/headers';
import type { UserProfile as UserProfileType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server';
import UserProfileCollections from '@/components/UserProfileCollections';
import { adminDb } from '@/lib/firebaseAdmin'; // We still need this for a simple user fetch
import { collection, query, where, getDocs, limit } from 'firebase/firestore';


interface ProfilePageProps {
  params: {
    username: string;
  };
}

// Simplified server-side fetch for basic user details.
async function fetchBasicUserProfile(username: string): Promise<UserProfileType | null> {
  console.log(`[UserProfilePage fetchBasicUserProfile] Attempting to fetch profile for username: "${username}"`);

  if (!adminDb || typeof adminDb.collection !== 'function') {
    console.error(`[UserProfilePage fetchBasicUserProfile] adminDb is not available or not a valid Firestore instance for username "${username}". Check firebaseAdmin.ts initialization and the FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable.`);
    return null;
  }

  try {
    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`[UserProfilePage fetchBasicUserProfile] No profile found for username: "${username}"`);
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    const userProfileData = {
        uuid: userDoc.id, // Use document ID as uuid if not stored in field
        username: userDoc.data().username,
        profile_name: userDoc.data().profile_name,
        profile_picture: userDoc.data().profile_picture || null,
        // bio: userDoc.data().bio || null, // Bio removed for now
    } as UserProfileType;
    console.log(`[UserProfilePage fetchBasicUserProfile] Found profile for "${username}": UUID ${userProfileData.uuid}`);
    return userProfileData;
  } catch (error: any) {
    console.error(`[UserProfilePage fetchBasicUserProfile] Error using adminDb for ${username}:`, error.message, error.code, error.stack);
    // Do not re-throw here to allow page to render with a "not found" state
    return null;
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const cookieStore = cookies();
  const { username } = params;
  console.log(`[UserProfilePage] Rendering profile for username from params: "${username}"`);

  const currentUser = await getCurrentUser(cookieStore); // Still useful for isOwnProfile
  const profileUser = await fetchBasicUserProfile(username);

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
          {/* Bio display removed for now */}
        </CardHeader>
        {/* ProfileImageUploader and ProfileBioEditor removed for now */}
      </Card>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center font-headline">
          <Library className="mr-3 h-8 w-8 text-primary" />
          {isOwnProfile ? "My Collections" : `Collections by ${profileUser.profile_name}`}
        </h2>
        {/* UserProfileCollections will handle fetching and display on the client */}
        <UserProfileCollections userId={profileUser.uuid} isOwnProfileView={isOwnProfile} profileOwnerName={profileUser.profile_name} />
      </section>
    </div>
  );
}
