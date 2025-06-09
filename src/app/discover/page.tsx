
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Library, PlusCircle } from 'lucide-react';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Button } from '@/components/ui/button';
import NextLink from 'next/link'; // Renamed to avoid conflict with Link type

interface EnrichedCollection extends Collection {
  ownerDetails?: UserProfile;
}

export default function DiscoverPage() {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuthStatus();

  useEffect(() => {
    const fetchCollectionsAndProfile = async () => {
      if (authLoading) {
        setLoading(true); 
        return;
      }

      if (!user || !user.uid) {
        setCollections([]);
        setLoading(false); 
        setError(null);    
        console.log('[DiscoverPage DEBUG] No user or UID, clearing collections.');
        return;
      }

      setLoading(true);
      setError(null);
      console.log(`[DiscoverPage DEBUG] Fetching profile and collections for user: ${user.uid}`);
      try {
        let currentUserProfile: UserProfile | undefined = undefined;
        const userProfileDocRef = doc(db, 'users', user.uid);
        const userProfileDocSnap = await getDoc(userProfileDocRef);
        
        if (userProfileDocSnap.exists()) {
            currentUserProfile = userProfileDocSnap.data() as UserProfile;
            console.log(`[DiscoverPage DEBUG] Found existing profile for UID: ${user.uid}`);
        } else {
            console.warn(`[DiscoverPage DEBUG] Profile for UID: ${user.uid} not found. Attempting to create.`);
            try {
                const baseUsername = (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/gi, '');
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const username = `${baseUsername}${randomSuffix}`;
                
                const newUserProfileData: UserProfile = {
                    uuid: user.uid,
                    username: username,
                    profile_name: user.displayName || user.email?.split('@')[0] || 'New User',
                    profile_picture: user.photoURL || null,
                };
                await setDoc(userProfileDocRef, newUserProfileData);
                currentUserProfile = newUserProfileData;
                console.log(`[DiscoverPage DEBUG] Successfully created missing profile for UID: ${user.uid}`);
            } catch (creationError) {
                console.error(`[DiscoverPage DEBUG] Failed to create missing profile for UID: ${user.uid}`, creationError);
            }
        }

        console.log(`[DiscoverPage DEBUG] Querying collections for owner: ${user.uid}`);
        const collectionsQuery = query(
          collection(db, 'collections'),
          where('owner', '==', user.uid), 
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(collectionsQuery);
        
        const fetchedCollections: EnrichedCollection[] = querySnapshot.docs.map(docSnapshot => {
          const colData = docSnapshot.data() as Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
          console.log(`[DiscoverPage DEBUG] Processing fetched collection: ID=${docSnapshot.id}, Title='${colData.title}', Owner=${colData.owner}`);
          return {
            ...colData,
            id: docSnapshot.id,
            createdAt: colData.createdAt,
            updatedAt: colData.updatedAt,
            ownerDetails: currentUserProfile 
          };
        });
        
        console.log(`[DiscoverPage DEBUG] Total collections processed for user ${user.uid}: ${fetchedCollections.length}. Titles: [${fetchedCollections.map(c => c.title).join(', ')}]`);
        setCollections(fetchedCollections);
      } catch (err: any) {
        console.error("[DiscoverPage DEBUG] Error fetching collections: ", err);
        setError(err.message || "Failed to load collections. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionsAndProfile();
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
        <div className="mt-6 mb-8 flex justify-center">
          <Button asChild size="lg">
            <NextLink href="/create-collection">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Collection
            </NextLink>
          </Button>
        </div>
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
        <Skeleton className="h-12 w-64 mt-6 mb-8" /> 
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
