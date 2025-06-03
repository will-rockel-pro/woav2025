
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Library } from 'lucide-react';
import { useAuthStatus } from '@/hooks/useAuthStatus';

interface EnrichedCollection extends Collection {
  ownerDetails?: UserProfile;
}

export default function DiscoverPage() {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuthStatus();

  useEffect(() => {
    const fetchCollections = async () => {
      if (authLoading) {
        setLoading(true); 
        return;
      }

      if (!user || !user.uid) {
        setCollections([]);
        setLoading(false); 
        setError(null);    
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Fetch current user's profile first
        let currentUserProfile: UserProfile | undefined = undefined;
        if (user && user.uid) { // Ensure user and user.uid are defined
            const userProfileDocRef = doc(db, 'users', user.uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);
            if (userProfileDocSnap.exists()) {
                currentUserProfile = userProfileDocSnap.data() as UserProfile;
            } else {
                console.warn(`[DiscoverPage] Logged-in user's profile (UID: ${user.uid}) not found in 'users' collection.`);
            }
        } else {
            console.warn("[DiscoverPage] User or user.uid is undefined, cannot fetch profile.");
        }


        const collectionsQuery = query(
          collection(db, 'collections'),
          where('owner', '==', user.uid), // Query for collections owned by the current user
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(collectionsQuery);
        
        const fetchedCollections: EnrichedCollection[] = querySnapshot.docs.map(docSnapshot => {
          const colData = docSnapshot.data() as Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
          // All these collections are owned by the current user, so use currentUserProfile
          return {
            ...colData,
            id: docSnapshot.id,
            createdAt: colData.createdAt,
            updatedAt: colData.updatedAt,
            ownerDetails: currentUserProfile // Use the pre-fetched profile
          };
        });
        
        setCollections(fetchedCollections);
      } catch (err: any) {
        console.error("Error fetching collections: ", err);
        setError(err.message || "Failed to load collections. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user, authLoading]); 

  if (authLoading || loading) {
    return <DiscoverLoading />;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <Library className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline mb-2">My Collections</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Please sign in to view your collections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <Library className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline mb-2">My Collections</h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          View and manage your personal collections.
        </p>
      </div>
 
      {collections.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">You haven't created any collections yet. Create your first one!</p>
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
