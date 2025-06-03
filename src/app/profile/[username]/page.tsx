
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/server'; 
import ProfileImageUploader from '@/components/ProfileImageUploader'; // Import the new component
import { doc, getDoc } from 'firebase/firestore';


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
  
  const profileUser = await fetchUserProfileByUuid(userId); // Fetch the profile user once

  const collections = querySnapshot.docs.map(docSnapshot => {
    const colData = docSnapshot.data() as Omit<CollectionType, 'id'>; // Ensure Timestamps are handled if they are objects
    return {
      id: docSnapshot.id,
      ...colData,
      createdAt: colData.createdAt as Timestamp, // Cast if necessary, depending on Firestore SDK version/setup
      updatedAt: colData.updatedAt as Timestamp, // Cast if necessary
      ownerDetails: profileUser || undefined // Use the pre-fetched profileUser
    } as EnrichedCollection;
  });
  return collections;
}

async function fetchUserProfileByUuid(uuid: string): Promise<UserProfileType | null> {
    const userDocRef = doc(db, 'users', uuid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfileType;
    }
    return null;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const profileUser = await fetchUserProfile(username);
  const currentUser = await getCurrentUser(); 

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
            <AvatarImage src={profileUser.profile_picture ?? undefined} alt={profileUser.profile_name} data-ai-hint="user profile large" />
            <AvatarFallback className="text-4xl">
              {profileUser.profile_name ? profileUser.profile_name.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl sm:text-4xl font-headline">{profileUser.profile_name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">@{profileUser.username}</CardDescription>
        </CardHeader>
        {isOwnProfile && (
          <CardContent className="p-6 border-t">
            <ProfileImageUploader 
              userId={profileUser.uuid} 
              currentImageUrl={profileUser.profile_picture}
              userName={profileUser.profile_name}
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
