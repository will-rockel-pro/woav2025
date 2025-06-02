'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, limit, orderBy, or, startAt, endAt, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, Collection, Link as LinkType } from '@/types';
import UserCard from '@/components/UserCard';
import CollectionCard from '@/components/CollectionCard';
import LinkCard from '@/components/LinkCard';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX, Files, Users, Link as LinkIcon } from 'lucide-react';

interface EnrichedCollection extends Collection {
  ownerDetails?: UserProfile;
}
interface SearchResults {
  users: UserProfile[];
  collections: EnrichedCollection[];
  links: LinkType[];
}

function SearchPageComponent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');

  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (!q || q.trim() === '') {
        setResults({ users: [], collections: [], links: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const searchTerm = q.trim().toLowerCase();

      try {
        // Search Users by username (case-insensitive prefix search)
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('username'),
          startAt(searchTerm),
          endAt(searchTerm + '\uf8ff'),
          limit(10)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

        // Search Collections by title (case-insensitive prefix search on published collections)
        // Firestore doesn't support case-insensitive search directly or multiple inequality filters well.
        // This is a simplified search. For robust search, use a dedicated search service like Algolia/Typesense.
        const collectionsQuery = query(
          collection(db, 'collections'),
          where('published', '==', true),
          orderBy('title'), // Requires an index on title
          startAt(searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)), // Attempt to match capitalized titles
          endAt(searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1) + '\uf8ff'),
          limit(10)
        );
        const collectionsSnapshot = await getDocs(collectionsQuery);
        
        const fetchedCollections: EnrichedCollection[] = [];
        for (const docSnapshot of collectionsSnapshot.docs) {
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
        
        // Search Links by URL or description (simplified)
        // This is very limited. Searching on partial strings in Firestore is hard.
        // We'll attempt to search by URL hostname.
        const linksQuery = query(
          collection(db, 'links'),
          // where('url', '>=', searchTerm), // This is not ideal for partial matches
          // where('url', '<=', searchTerm + '\uf8ff'),
          orderBy('url'), // Requires index
          limit(10)
        );
        // This link search will be very broad and likely not very useful without a proper search engine.
        // For now, filtering client-side after a broader fetch, or a more targeted query if possible.
        // Due to limitations, I'll show a placeholder for link search for now.
        // A more realistic approach for links would be to search within discovered collections.
        const linksSnapshot = await getDocs(linksQuery);
        const links = linksSnapshot.docs
          .map(doc => doc.data() as LinkType)
          .filter(link => link.url.toLowerCase().includes(searchTerm) || link.description?.toLowerCase().includes(searchTerm));


        setResults({ users, collections: fetchedCollections, links });
      } catch (err: any) {
        console.error("Search error: ", err);
        setError(err.message || "Failed to perform search.");
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [q]);

  if (loading) {
    return <SearchLoading query={q || ""} />;
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }
  
  if (!q || q.trim() === '') {
    return (
      <div className="text-center py-10">
        <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Search WOAV Lite</h2>
        <p className="text-muted-foreground">Enter a term in the search bar above to find users, collections, or links.</p>
      </div>
    );
  }

  if (!results || (results.users.length === 0 && results.collections.length === 0 && results.links.length === 0)) {
    return (
      <div className="text-center py-10">
        <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Results Found for "{q}"</h2>
        <p className="text-muted-foreground">Try a different search term or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold font-headline">Search Results for "{q}"</h1>
      
      {results.collections.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><Files className="mr-3 h-6 w-6 text-primary" /> Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.collections.map(col => <CollectionCard key={col.id} collection={col} owner={col.ownerDetails} />)}
          </div>
        </section>
      )}

      {results.users.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><Users className="mr-3 h-6 w-6 text-primary" /> Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.users.map(user => <UserCard key={user.uuid} user={user} />)}
          </div>
        </section>
      )}
      
      {results.links.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><LinkIcon className="mr-3 h-6 w-6 text-primary" /> Links</h2>
          <div className="space-y-4">
            {results.links.map(link => <LinkCard key={link.id} link={link} />)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Note: Link search is currently basic. For more relevant link results, try searching within specific collections.</p>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading query="your query" />}>
      <SearchPageComponent />
    </Suspense>
  );
}

function SearchLoading({ query }: { query: string }) {
  return (
    <div className="space-y-10">
      <Skeleton className="h-9 w-1/2" />
      
      <section>
        <Skeleton className="h-8 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <CardSkeleton key={`col-${i}`} />)}
        </div>
      </section>

      <section>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(2)].map((_, i) => <UserCardSkeleton key={`user-${i}`} />)}
        </div>
      </section>

       <section>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <LinkCardSkeleton key={`link-${i}`} />)}
        </div>
      </section>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border rounded-lg shadow-md p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-9 w-full mt-2" />
    </div>
  );
}

function UserCardSkeleton() {
  return (
     <div className="border rounded-lg shadow-md p-4 flex items-center space-x-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function LinkCardSkeleton() {
  return (
    <div className="border rounded-lg shadow-md p-4 space-y-2">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

