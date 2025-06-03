
// import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
// import { adminDb } from '@/lib/firebaseAdmin'; // Temporarily remove adminDb usage
import type { UserProfile as UserProfileType, Collection as CollectionType } from '@/types';
// import CollectionCard from '@/components/CollectionCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserCircle, Library, Info } from 'lucide-react';
// import { getCurrentUser } from '@/lib/auth/server';
// import ProfileImageUploader from '@/components/ProfileImageUploader';
// import ProfileBioEditor from '@/components/ProfileBioEditor';
// import { cookies } from 'next/headers';
import { Separator } from '@/components/ui/separator';


interface ProfilePageProps {
  params: {
    username: string;
  };
}

// interface EnrichedCollection extends CollectionType {
//   ownerDetails?: UserProfileType;
// }

// // Temporarily removed to prevent crashes due to adminDb issues.
// async function fetchUserProfile(username: string): Promise<UserProfileType | null> {
//   console.warn(`[UserProfilePage fetchUserProfile] Data fetching for ${username} is temporarily disabled.`);
//   // Return mock data or null to allow the page to render without server errors.
//   return {
//     uuid: `mock-${username}`,
//     username: username,
//     profile_name: `User ${username}`,
//     profile_picture: undefined,
//     bio: "Profile data is temporarily unavailable.",
//   };
// }

// async function fetchUserCollections(
//   userId: string,
//   isOwnProfileView: boolean,
//   profileOwnerForCollections: UserProfileType | null
// ): Promise<EnrichedCollection[]> {
//   console.warn(`[UserProfilePage fetchUserCollections] Collection fetching for ${userId} is temporarily disabled.`);
//   return [];
// }


export default async function UserProfilePage({ params }: ProfilePageProps) {
  // const cookieStore = cookies(); // Mark page as dynamic
  const { username } = params;

  console.log(`[UserProfilePage] Rendering basic profile for username from params: "${username}"`);

  // // Temporarily disable server-side user fetching to avoid adminDb errors
  // const currentUser = await getCurrentUser(cookieStore);
  // const profileUser = await fetchUserProfile(username);

  // Hardcoded/mocked profile user for display to prevent crash
  const profileUser: UserProfileType | null = {
    uuid: `mock-uuid-for-${username}`,
    username: username,
    profile_name: `User ${username}`,
    profile_picture: `https://placehold.co/128x128.png?text=${username.charAt(0).toUpperCase()}`,
    bio: "Profile information is temporarily displayed with mock data.",
  };
  
  const collections: CollectionType[] = []; // Empty collections

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <UserCircle className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-2">User Not Found (Temporarily)</h1>
        <p className="text-lg text-muted-foreground">
          Profile data for "@{username}" is currently unavailable.
        </p>
      </div>
    );
  }

  const isOwnProfile = false; // Assume not own profile to hide editing features
  console.log(`[UserProfilePage] isOwnProfile temporarily set to: ${isOwnProfile}`);


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
        )} */}
      </Card>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center font-headline">
          <Library className="mr-3 h-8 w-8 text-primary" />
          {isOwnProfile ? "My Collections" : `Collections by ${profileUser.profile_name}`} (Temporarily Hidden)
        </h2>
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} owner={col.ownerDetails || profileUser} />
            ))} */}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg shadow-sm bg-card">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              Collections are temporarily unavailable.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
