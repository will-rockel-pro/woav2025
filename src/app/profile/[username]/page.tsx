
import { collection, query, where, getDocs, limit, orderBy, Timestamp, doc } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin'; // Correctly import adminDb
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info, Edit3 } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server';
import ProfileImageUploader from '@/components/ProfileImageUploader';
import ProfileBioEditor from '@/components/ProfileBioEditor';
import { cookies } from 'next/headers';
import { Separator } from '@/components/ui/separator';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfileType;
}

async function fetchUserProfile(username: string): Promise<UserProfileType | null> {
  console.log(`[UserProfilePage fetchUserProfile] Fetching profile for username: "${username}" using adminDb`);
  try {
    const usersRef = collection(adminDb, 'users'); // Use adminDb
    const q = query(usersRef, where('username', '==', String(username).toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.warn(`[UserProfilePage fetchUserProfile] No user found for username "${String(username)}"`);
      return null;
    }
    const userProfileData = querySnapshot.docs[0].data() as UserProfileType;
    console.log(`[UserProfilePage fetchUserProfile] Found profile for "${username}": UUID ${userProfileData.uuid}`);
    return userProfileData;
  } catch (error: any) {
    console.error(`[UserProfilePage fetchUserProfile] Error using adminDb for ${username}:`, error.message, error.code, error.stack);
    throw error;
  }
}

async function fetchUserCollections(
  userId: string,
  isOwnProfileView: boolean,
  profileOwnerForCollections: UserProfileType | null
): Promise<EnrichedCollection[]> {
  console.log(`[UserProfilePage fetchUserCollections] Fetching collections for user ID: "${userId}", isOwnProfileView: ${isOwnProfileView} using adminDb`);
  if (!userId) {
    console.warn("[UserProfilePage fetchUserCollections] userId is undefined, cannot fetch collections.");
    return [];
  }
  try {
    const collectionsRef = collection(adminDb, 'collections'); // Use adminDb
    let q;

    if (isOwnProfileView) {
      q = query(collectionsRef, where('owner', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        collectionsRef,
        where('owner', '==', userId),
        where('published', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    console.log(`[UserProfilePage fetchUserCollections] Found ${querySnapshot.docs.length} collections for user ID: "${userId}" (isOwnProfileView: ${isOwnProfileView})`);

    const collections = querySnapshot.docs.map(docSnapshot => {
      const colData = docSnapshot.data() as Omit<CollectionType, 'id'>;
      // Ensure Timestamps are correctly handled if they are not already Timestamps
      const createdAt = colData.createdAt instanceof Timestamp ? colData.createdAt : Timestamp.fromDate(new Date()); // Fallback or ensure correct type
      const updatedAt = colData.updatedAt instanceof Timestamp ? colData.updatedAt : Timestamp.fromDate(new Date()); // Fallback or ensure correct type

      return {
        id: docSnapshot.id,
        ...colData,
        createdAt: createdAt,
        updatedAt: updatedAt,
        ownerDetails: profileOwnerForCollections || undefined
      } as EnrichedCollection;
    });
    return collections;
  } catch (error: any) {
    console.error(`[UserProfilePage fetchUserCollections] Error using adminDb for user ${userId}:`, error.message, error.code, error.stack);
    throw error;
  }
}


export default async function UserProfilePage({ params }: ProfilePageProps) {
  console.log('[UserProfilePage DEBUG UserProfilePage] Server component execution START.');
  const cookieStore = cookies();
  const { username } = params;

  console.log(`[UserProfilePage DEBUG UserProfilePage] Rendering profile for username from params: "${username}"`);

  const currentUser = await getCurrentUser(cookieStore);
  console.log(`[UserProfilePage DEBUG UserProfilePage] currentUser from getCurrentUser:`, currentUser ? { uid: currentUser.uid, email: currentUser.email } : null);

  const profileUser = await fetchUserProfile(username);
  console.log(`[UserProfilePage DEBUG UserProfilePage] profileUser from fetchUserProfile("${username}"):`, profileUser ? { uuid: profileUser.uuid, username: profileUser.username, bio: profileUser.bio } : null);


  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <UserCircle className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">User Not Found</h1>
        <p className="text-lg text-muted-foreground">
          Sorry, we couldn't find a profile for "@{username}".
        </p>
      </div>
    );
  }

  const isOwnProfile = !!currentUser && !!profileUser && currentUser.uid === profileUser.uuid;

  console.log(`[UserProfilePage DEBUG UserProfilePage] Values for isOwnProfile check:`);
  console.log(`  currentUser?.uid: ${currentUser?.uid}`);
  console.log(`  profileUser.uuid: ${profileUser.uuid}`);
  console.log(`  isOwnProfile evaluates to: ${isOwnProfile}`);

  const collections = await fetchUserCollections(profileUser.uuid, isOwnProfile, profileUser);
  console.log(`[UserProfilePage DEBUG UserProfilePage] Fetched ${collections.length} collections.`);


  return (
    <div className="space-y-10">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center p-6 sm:p-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 border-4 border-background shadow-md">
            <AvatarImage
              src={profileUser.profile_picture ?? undefined}
              alt={profileUser.profile_name}
              priority
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
        {isOwnProfile && (
          <CardContent className="p-6 border-t space-y-6">
            <ProfileImageUploader
              userId={profileUser.uuid}
              currentImageUrl={profileUser.profile_picture}
              userName={profileUser.profile_name}
            />
            <Separator />
            <ProfileBioEditor
              userId={profileUser.uuid}
              currentBio={profileUser.bio || ""}
            />
          </CardContent>
        )}
      </Card>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center font-headline">
          <Library className="mr-3 h-8 w-8 text-primary" />
          {isOwnProfile ? "My Collections" : `Collections by ${profileUser.profile_name}`} ({collections.length})
        </h2>
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} owner={col.ownerDetails || profileUser} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg shadow-sm bg-card">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {isOwnProfile ? "You haven't created any collections yet." : `${profileUser.profile_name} hasn't created any public collections yet.`}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
