
'use server';

import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin'; // Ensure this path is correct
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server';
import { cookies } from 'next/headers';
import UserProfileCollections from '@/components/UserProfileCollections';
// import ProfileImageUploader from '@/components/ProfileImageUploader';
// import ProfileBioEditor from '@/components/ProfileBioEditor';


interface ProfilePageProps {
  params: {
    username: string;
  };
}

async function fetchUserProfile(username: string): Promise<UserProfileType | null> {
  console.log(`[UserProfilePage fetchUserProfile] Attempting to fetch profile for username: "${username}"`);

  // Critical check for adminDb before use
  if (!adminDb || typeof adminDb.collection !== 'function') {
    console.error(`[UserProfilePage fetchUserProfile] adminDb is not available or not a valid Firestore instance for username "${username}". Check firebaseAdmin.ts initialization and the FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable.`);
    return null; // Prevent further execution and crash
  }

  try {
    const usersRef = collection(adminDb, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`[UserProfilePage fetchUserProfile] No profile found for username: "${username}"`);
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    // Ensure all fields are correctly typed, especially if some are optional
    const userProfileData = {
        uuid: userDoc.id,
        username: userDoc.data().username,
        profile_name: userDoc.data().profile_name,
        profile_picture: userDoc.data().profile_picture || null, // Default to null if undefined
        bio: userDoc.data().bio || null, // Default to null if undefined
    } as UserProfileType;
    console.log(`[UserProfilePage fetchUserProfile] Found profile for "${username}": UUID ${userProfileData.uuid}`);
    return userProfileData;
  } catch (error: any) {
    console.error(`[UserProfilePage fetchUserProfile] Error using adminDb for ${username}:`, error.message, error.code, error.stack);
    // Do not re-throw here to allow page to render with a "not found" state
    return null;
  }
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const cookieStore = cookies();
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
          The profile for "@{username}" could not be found. This might be due to a server error or the user not existing.
        </p>
         <p className="text-sm text-muted-foreground mt-2">Please check the server logs for more details if this issue persists.</p>
      </div>
    );
  }

  const isOwnProfile = !!(currentUser && currentUser.uid === profileUser.uuid);
  // console.log(`[UserProfilePage] isOwnProfile determined as: ${isOwnProfile} (currentUser UID: ${currentUser?.uid}, profileUser UUID: ${profileUser.uuid})`);

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
            <p className="text-sm text-muted-foreground mt-2 max-w-prose whitespace-pre-wrap">{profileUser.bio}</p>
          )}
        </CardHeader>
        {/* {isOwnProfile && (
          <CardContent className="border-t pt-6 space-y-6">
            <ProfileImageUploader userId={profileUser.uuid} currentImageUrl={profileUser.profile_picture} userName={profileUser.profile_name} />
            <ProfileBioEditor userId={profileUser.uuid} currentBio={profileUser.bio || ''} />
          </CardContent>
        )} */}
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
