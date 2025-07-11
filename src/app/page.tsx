
import LinkFromNext from 'next/link'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { Bookmark, Search, Users, Library, Info } from 'lucide-react';
import { adminDb } from '@/lib/firebaseAdmin'; // Using adminDb
import type { Collection as CollectionType, UserProfile } from '@/types';
import { Timestamp } from 'firebase-admin/firestore'; // Use Admin SDK Timestamp
import CollectionCard from '@/components/CollectionCard';
import { getCurrentUser } from '@/lib/auth/server'; // Import getCurrentUser

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfile;
}

async function getPublicCollections(): Promise<EnrichedCollection[]> {
  // If adminDb is not available (e.g., in a build environment without credentials), return empty.
  if (!adminDb || typeof adminDb.collection !== 'function' || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
    console.warn("[HomePage getPublicCollections] Firebase Admin SDK not available or configured. Returning empty array for build process.");
    return [];
  }

  try {
    const collectionsQuery = adminDb.collection('collections')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(20);
    
    const querySnapshot = await collectionsQuery.get();

    const collections: EnrichedCollection[] = [];
    for (const docSnapshot of querySnapshot.docs) {
      const colData = docSnapshot.data() as Omit<CollectionType, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
      let ownerDetails: UserProfile | undefined = undefined;

      if (colData.owner) {
         const userProfileDocRef = adminDb.collection('users').doc(colData.owner);
         const userProfileDocSnap = await userProfileDocRef.get();
         if (userProfileDocSnap.exists) {
             ownerDetails = userProfileDocSnap.data() as UserProfile;
         } else {
            console.warn(`[HomePage] Owner profile for UID ${colData.owner} not found for collection ${docSnapshot.id}.`);
         }
      } else {
        console.warn(`[HomePage] Collection ${docSnapshot.id} is missing an owner UID.`);
      }

      collections.push({
        ...colData,
        id: docSnapshot.id,
        createdAt: colData.createdAt, 
        updatedAt: colData.updatedAt, 
        ownerDetails
      });
    }
    return collections;
  } catch (error: any) {
    console.error("[HomePage getPublicCollections] Error fetching public collections:", error.message, error.code, error.stack);
    return [];
  }
}

export default async function HomePage() {
  const publicCollections = await getPublicCollections();
  const currentUser = await getCurrentUser(); // Get current user's auth state

  return (
    <>
      {/* Existing Homepage Content Section */}
      <div className="flex flex-col items-center justify-center text-center py-12">
        <Bookmark className="w-24 h-24 text-primary mb-6" />
        <h1 className="font-headline text-5xl font-bold mb-4">Welcome to WOAV Lite</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Your personal space to discover, save, and organize interesting finds from across the web.
          Start building your curated collections today.
        </p>
        <div className="flex space-x-4">
          {currentUser ? (
            <Button asChild size="lg">
              <LinkFromNext href="/discover">
                <Search className="mr-2 h-5 w-5" /> My Collections
              </LinkFromNext>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg">
              <LinkFromNext href="/auth/signin">
                <Users className="mr-2 h-5 w-5" /> Join or Sign In
              </LinkFromNext>
            </Button>
          )}
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <Bookmark className="w-12 h-12 text-accent mb-3" />
            <h3 className="text-lg font-semibold mb-2">Curate Collections</h3>
            <p className="text-sm text-muted-foreground">Organize links into meaningful collections for easy access.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <Search className="w-12 h-12 text-accent mb-3" />
            <h3 className="text-lg font-semibold mb-2">Discover Content</h3>
            <p className="text-sm text-muted-foreground">Find inspiring collections and links shared by the community.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
            <Users className="w-12 h-12 text-accent mb-3" />
            <h3 className="text-lg font-semibold mb-2">Connect & Share</h3>
            <p className="text-sm text-muted-foreground">Follow users and collaborate on collections (coming soon).</p>
          </div>
        </div>
      </div>

      {/* New All Public Collections Section */}
      <section className="py-16">
        <div className="text-center mb-12">
            <Library className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold font-headline">Explore Public Collections</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-2">
              Discover what others are curating from around the web.
            </p>
        </div>
        {publicCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicCollections.map((col, index) => (
              <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg shadow-sm bg-card flex flex-col items-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No public collections found yet, or there was an issue fetching them.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon or create the first public collection!</p>
          </div>
        )}
      </section>
    </>
  );
}
