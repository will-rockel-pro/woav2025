'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass } from 'lucide-react';

interface EnrichedCollection extends Collection {
  ownerDetails?: UserProfile;
}

export default function DiscoverPage() {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError(null);
      try {
        const collectionsQuery = query(
          collection(db, 'collections'),
          where('published', '==', true),
          orderBy('updatedAt', 'desc'),
          limit(20) // Limit for performance, add pagination later
        );
        const querySnapshot = await getDocs(collectionsQuery);
        
        const fetchedCollections: EnrichedCollection[] = [];
        for (const docSnapshot of querySnapshot.docs) {
          const colData = docSnapshot.data() as Collection;
          let ownerDetails: UserProfile | undefined = undefined;
          if (colData.owner) {
            const ownerDoc = await getDoc(doc(db, 'users', colData.owner));
            if (ownerDoc.exists()) {
              ownerDetails = ownerDoc.data() as UserProfile;
            }
          }
          fetchedCollections.push({ ...colData, id: docSnapshot.id, ownerDetails });
        }
        setCollections(fetchedCollections);
      } catch (err: any) {
        console.error("Error fetching collections: ", err);
        setError(err.message || "Failed to load collections. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return <DiscoverLoading />;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <Compass className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline mb-2">Discover Collections</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Explore curated collections from the WOAV Lite community. Find inspiration and new interests.
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No published collections found yet. Be the first to create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} />
          ))}
        </div>
      )}
    </div>
  );
}

function DiscoverLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="w-16 h-16 rounded-full mb-4" />
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border rounded-lg shadow-md p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-full mt-2" />
    </div>
  );
}
