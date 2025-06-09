
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
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let currentUserProfile: UserProfile | undefined = undefined;
        if (user && user.uid) {
            const userProfileDocRef = doc(db, 'users', user.uid);
            const userProfileDocSnap = await getDoc(userProfileDocRef);
            if (userProfileDocSnap.exists()) {
                currentUserProfile = userProfileDocSnap.data() as UserProfile;
            } else {
                console.warn(`[DiscoverPage] Logged-in user's profile (UID: ${user.uid}) not found in 'users' collection. Attempting to create it.`);
                try {
                    const baseUsername = (user.displayName || user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/gi, '');
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
                    const username = `${baseUsername}${randomSuffix}`;
                    
                    const newUserProfileData: UserProfile = {
                        uuid: user.uid,
                        username: username,
                        profile_name: user.displayName || user.email?.split('@')[0] || 'New User',
                        profile_picture: user.photoURL || null,
                    };
                    await setDoc(userProfileDocRef, newUserProfileData);
                    currentUserProfile = newUserProfileData; // Use the newly created profile
                    console.log(`[DiscoverPage] Successfully created missing profile for UID: ${user.uid}`);
                } catch (creationError) {
                    console.error(`[DiscoverPage] Failed to create missing profile for UID: ${user.uid}`, creationError);
                }
            }
        } else {
            console.warn("[DiscoverPage] User or user.uid is undefined, cannot fetch profile.");
        }

        const collectionsQuery = query(
          collection(db, 'collections'),
          where('owner', '==', user.uid), 
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(collectionsQuery);
        
        const fetchedCollections: EnrichedCollection[] = querySnapshot.docs.map(docSnapshot => {
          const colData = docSnapshot.data() as Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: Timestamp, updatedAt: Timestamp };
          return {
            ...colData,
            id: docSnapshot.id,
            createdAt: colData.createdAt,
            updatedAt: colData.updatedAt,
            ownerDetails: currentUserProfile 
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
