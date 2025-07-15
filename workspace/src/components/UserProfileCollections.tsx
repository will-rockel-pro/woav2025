
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import type { Collection as CollectionType, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';

interface UserProfileCollectionsProps {
  userId: string;
  isOwnProfileView: boolean;
  profileOwnerName: string;
}

interface EnrichedCollection extends CollectionType {
  ownerDetails?: UserProfile;
}

export default function UserProfileCollections({ userId, isOwnProfileView, profileOwnerName }: UserProfileCollectionsProps) {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { db } = useFirebaseServices();

  useEffect(() => {
    const fetchCollections = async () => {
      if (!userId) {
        setLoading(false);
        setError("User ID is missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let q;
        if (isOwnProfileView) {
          q = query(
            collection(db, 'collections'),
            where('owner', '==', userId),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(
            collection(db, 'collections'),
            where('owner', '==', userId),
            where('published', '==', true),
            orderBy('createdAt', 'desc')
          );
        }
        const querySnapshot = await getDocs(q);
        
        const fetchedCollectionsPromises = querySnapshot.docs.map(async (docSnapshot) => {
          const colData = docSnapshot.data();
          let ownerDetails: UserProfile | undefined = undefined;
          // Fetch owner details for each collection - important for CollectionCard
          if (colData.owner) {
            const ownerDocRef = doc(db, 'users', colData.owner);
            const ownerDocSnap = await getDoc(ownerDocRef);
            if (ownerDocSnap.exists()) {
              ownerDetails = ownerDocSnap.data() as UserProfile;
            }
          }
          return {
            id: docSnapshot.id,
            ...colData,
            createdAt: (colData.createdAt as Timestamp),
            updatedAt: (colData.updatedAt as Timestamp),
            ownerDetails: ownerDetails, // Add owner details here
          } as EnrichedCollection;
        });

        const fetchedCollections = await Promise.all(fetchedCollectionsPromises);
        setCollections(fetchedCollections);

      } catch (err: any) {
        console.error("Error fetching user collections:", err);
        setError(err.message || "Failed to load collections.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [userId, isOwnProfileView, db]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg shadow-md p-4 space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border rounded-lg shadow-sm bg-card">
        <Info className="mx-auto h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive text-lg">Could not load collections: {error}</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg shadow-sm bg-card">
        <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-lg">
          {isOwnProfileView ? "You haven't created any collections yet." : `${profileOwnerName} hasn't published any collections yet.`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {collections.map((col) => (
        <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} />
      ))}
    </div>
  );
}
