
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bookmark, Search, Users, Library } from 'lucide-react';
// import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import type { Collection as CollectionType, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';

// interface EnrichedCollection extends CollectionType {
//   ownerDetails?: UserProfile;
// }

// async function getPublicCollections(): Promise<EnrichedCollection[]> {
//   try {
//     const collectionsQuery = query(
//       collection(db, 'collections'),
//       where('published', '==', true),
//       orderBy('createdAt', 'desc'),
//       limit(20)
//     );
//     const querySnapshot = await getDocs(collectionsQuery);

//     const collections: EnrichedCollection[] = [];
//     for (const docSnapshot of querySnapshot.docs) {
//       const colData = docSnapshot.data() as Omit<CollectionType, 'id'>;
//       let ownerDetails: UserProfile | undefined = undefined;

//       if (colData.owner) {
//          const userProfileDocRef = doc(db, 'users', colData.owner);
//          const userProfileDocSnap = await getDoc(userProfileDocRef);
//          if (userProfileDocSnap.exists()) {
//              ownerDetails = userProfileDocSnap.data() as UserProfile;
//          } else {
//             console.warn(`[HomePage] Owner profile for UID ${colData.owner} not found for collection ${docSnapshot.id}.`);
//          }
//       } else {
//         console.warn(`[HomePage] Collection ${docSnapshot.id} is missing an owner UID.`);
//       }

//       collections.push({
//         ...colData,
//         id: docSnapshot.id,
//         createdAt: colData.createdAt as Timestamp,
//         updatedAt: colData.updatedAt as Timestamp,
//         ownerDetails
//       });
//     }
//     return collections;
//   } catch (error) {
//     console.error("Error fetching public collections:", error);
//     return [];
//   }
// }

export default async function HomePage() {
  // const publicCollections = await getPublicCollections();
  const publicCollections: any[] = []; // Temporarily use an empty array

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
          <Button asChild size="lg">
            <Link href="/discover">
              <Search className="mr-2 h-5 w-5" /> My Collections
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signin">
              <Users className="mr-2 h-5 w-5" /> Join or Sign In
            </Link>
          </Button>
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
              Discover what others are curating from around the web. (Data fetching temporarily disabled for debugging)
            </p>
        </div>
        {publicCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicCollections.map((col, index) => (
              <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} priority={index < 4} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">Public collections temporarily unavailable while debugging. Check back soon!</p>
        )}
      </section>
    </>
  );
}
