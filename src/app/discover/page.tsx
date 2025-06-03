
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore'; // Removed orderBy
import { db } from '@/lib/firebase';
import type { Collection, UserProfile } from '@/types';
import CollectionCard from '@/components/CollectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Library } from 'lucide-react'; // Changed Compass to Library

interface EnrichedCollection extends Collection {
  ownerDetails?: UserProfile;
}

export default function DiscoverPage() {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assuming useAuthStatus hook provides the authenticated user or null
  // You need to import and use your actual useAuthStatus hook here
  // const { user, loading: authLoading } = useAuthStatus();
  // For demonstration, let's simulate a user ID (replace with actual hook)
  const user = { uid: 'replace-with-actual-user-id' }; // Replace with actual user object from hook
  const authLoading = false; // Replace with actual loading state from hook

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError(null);
      try {
        const collectionsQuery = query(
          collection(db, 'collections'),
          // Filter by the authenticated user's ID
          where('userId', '==', user.uid),
          // orderBy('createdAt', 'desc'), // Temporarily removed for index issue
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

    // Fetch collections only if the user is authenticated and auth status is not loading
    if (user && !authLoading) {
      fetchCollections();
    } else if (!user && !authLoading) {
      setLoading(false); // Stop loading if no user is authenticated
    }
  }, [user, authLoading]); // Depend on user and authLoading state

  if (loading || authLoading) {
    return <DiscoverLoading />;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <Library className="w-16 h-16 text-primary mb-4" /> {/* Changed icon to Library */}
        <h1 className="text-4xl font-bold font-headline mb-2">My Collections</h1> {/* Changed title */}
        <p className="text-lg text-muted-foreground max-w-xl">
          View and manage your personal collections.
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
