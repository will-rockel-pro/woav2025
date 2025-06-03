
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // auth might be needed for own profile check
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server'; // Helper to get current user on server

interface ProfilePageProps {
  params: {
    username: string;
  };
}

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfileType;
}

async function fetchUserProfile(username: string): Promise<UserProfileType | null> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  return querySnapshot.docs[0].data() as UserProfileType;
}

async function fetchUserCollections(
  userId: string,
  isOwnProfile: boolean
): Promise<EnrichedCollection[]> {
  const collectionsRef = collection(db, 'collections');
  let q;

  if (isOwnProfile) {
    // Fetch all collections (public and private) for the owner
    q = query(collectionsRef, where('owner', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    // Fetch only public collections for other users
    q = query(
      collectionsRef,
      where('owner', '==', userId),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  const collections = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as EnrichedCollection[];
  
  // For CollectionCard, the ownerDetails will be the profile user themselves.
  // This could be redundant if CollectionCard can infer, but explicit is fine.
  const profileUser = await fetchUserProfileByUuid(userId);
  return collections.map(col => ({ ...col, ownerDetails: profileUser || undefined }));
}

// Helper to fetch user profile by UUID, useful for enriching collection data
async function fetchUserProfileByUuid(uuid: string): Promise<UserProfileType | null> {
    const userDocRef = doc(db, 'users', uuid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfileType;
    }
    return null;
}
// Need to import doc and getDoc for fetchUserProfileByUuid
import { doc, getDoc } from 'firebase/firestore';


export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const profileUser = await fetchUserProfile(username);
  const currentUser = await getCurrentUser(); // Get the currently logged-in user (if any)

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

  const isOwnProfile = currentUser?.uid === profileUser.uuid;
  const collections = await fetchUserCollections(profileUser.uuid, isOwnProfile);

  return (
    <div className="space-y-10">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center p-6 sm:p-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 border-4 border-background shadow-md">
            <AvatarImage src={profileUser.profile_picture} alt={profileUser.profile_name} data-ai-hint="user avatar large" />
            <AvatarFallback className="text-4xl">
              {profileUser.profile_name ? profileUser.profile_name.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl sm:text-4xl font-headline">{profileUser.profile_name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">@{profileUser.username}</CardDescription>
          {/* Could add bio or other details here in the future */}
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center font-headline">
          <Library className="mr-3 h-8 w-8 text-primary" />
          {isOwnProfile ? "My Collections" : `Collections by ${profileUser.profile_name}`} ({collections.length})
        </h2>
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((col) => (
              // Pass the profileUser as ownerDetails since these are their collections
              <CollectionCard key={col.id} collection={col} owner={profileUser} />
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
