
'use client';

import { useState, useEffect } from 'react';
import LinkFromNext from 'next/link';
import { Button } from '@/components/ui/button';
import { Bookmark, Search, Users, Library, Info } from 'lucide-react';
import type { Collection as CollectionType, UserProfile } from '@/types';
import { Timestamp, collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Use client-side db
import CollectionCard from '@/components/CollectionCard';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfile;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuthStatus();
  const [publicCollections, setPublicCollections] = useState<EnrichedCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  useEffect(() => {
    // Only fetch collections once Firebase is initialized (signaled by authLoading being false).
    if (authLoading) {
      return;
    }

    const getPublicCollections = async (): Promise<void> => {
      setLoadingCollections(true);
      try {
        const collectionsQuery = query(
          collection(db, 'collections'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(collectionsQuery);

        const collectionsPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const colData = docSnapshot.data() as Omit<CollectionType, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
          let ownerDetails: UserProfile | undefined = undefined;

          if (colData.owner) {
            const userProfileDocRef = doc(db, 'users', colData.owner);
            const userProfileDocSnap = await getDoc(userProfileDocRef);
            if (userProfileDocSnap.exists()) {
              ownerDetails = userProfileDocSnap.data() as UserProfile;
            }
          }

          return {
            ...colData,
            id: docSnapshot.id,
            createdAt: colData.createdAt,
            updatedAt: colData.updatedAt,
            ownerDetails,
          };
        });

        const collections = await Promise.all(collectionsPromises);
        setPublicCollections(collections);
      } catch (error: any) {
        console.error("[HomePage] Error fetching public collections:", error.message);
      } finally {
        setLoadingCollections(false);
      }
    };

    getPublicCollections();
  }, [authLoading]); // Re-run effect when auth loading state changes.

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
          {authLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : user ? (
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
        {loadingCollections ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg shadow-md p-4 space-y-3">
                <Skeleton className="h-48 w-full rounded-md" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : publicCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publicCollections.map((col, index) => (
              <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg shadow-sm bg-card flex flex-col items-center">
            <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No public collections found yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon or create the first public collection!</p>
          </div>
        )}
      </section>
    </>
  );
}
