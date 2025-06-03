
'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, /* orderBy, */ getDocs, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection, Link as LinkType, UserProfile } from '@/types';
import Image from 'next/image';
import LinkCard from '@/components/LinkCard';
import AddLinkForm from '@/components/AddLinkForm';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Info, Link as LinkIconFeather, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EnrichedLink extends LinkType {
  id: string;
}

export default function CollectionPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuthStatus();
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [links, setLinks] = useState<EnrichedLink[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionId = params.id;

  const fetchCollectionAndLinks = useCallback(async () => {
    if (!collectionId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch collection details
      const collectionDocRef = doc(db, 'collections', collectionId);
      const collectionDocSnap = await getDoc(collectionDocRef);

      if (!collectionDocSnap.exists()) {
        setError('Collection not found.');
        setCollectionData(null);
        setLoading(false);
        return;
      }

      const fetchedCollection = { id: collectionDocSnap.id, ...collectionDocSnap.data() } as Collection;
      setCollectionData(fetchedCollection);

      // Fetch owner profile if owner ID exists
      if (fetchedCollection.owner) {
        const ownerDocRef = doc(db, 'users', fetchedCollection.owner);
        const ownerDocSnap = await getDoc(ownerDocRef);
        if (ownerDocSnap.exists()) {
          setOwnerProfile(ownerDocSnap.data() as UserProfile);
        }
      }

      // Fetch links for this collection
      const linksQuery = query(
        collection(db, 'links'),
        where('collectionId', '==', collectionId)
        // Temporarily removed: orderBy('createdAt', 'desc') 
        // This will allow links to load but they won't be sorted by date
        // until the Firestore index (collectionId ASC, createdAt DESC) is enabled.
      );
      const linksSnapshot = await getDocs(linksQuery);
      const fetchedLinks = linksSnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as EnrichedLink[];
      setLinks(fetchedLinks);

    } catch (err: any) {
      console.error('Error fetching collection details or links:', err);
      setError(err.message || 'Failed to load collection data.');
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchCollectionAndLinks();
  }, [fetchCollectionAndLinks]);

  const handleLinkAdded = (newLink: LinkType) => {
    fetchCollectionAndLinks(); 
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48 mb-6" /> 

        <div className="border rounded-lg shadow-md overflow-hidden">
          <Skeleton className="w-full h-64 bg-muted flex items-center justify-center">
              <ImageOff className="w-16 h-16 text-gray-400" />
          </Skeleton>
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-3/4" /> 
            <Skeleton className="h-4 w-1/4" /> 
            <Skeleton className="h-5 w-full" /> 
            <Skeleton className="h-5 w-2/3" /> 
          </div>
        </div>
        
        <div className="border rounded-lg shadow-md">
          <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-1/3 mb-3" /> 
              <Skeleton className="h-10 w-full mb-2" /> 
              <Skeleton className="h-10 w-full mb-2" /> 
              <Skeleton className="h-20 w-full mb-3" /> 
              <Skeleton className="h-10 w-1/3" /> 
          </div>
        </div>


        <section className="mt-10">
          <Skeleton className="h-9 w-1/2 mb-6" /> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg shadow-md p-4 space-y-2">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-6 w-6 rounded mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <Info className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button asChild variant="link" className="mt-4">
          <Link href="/discover"><ArrowLeft className="mr-2 h-4 w-4" /> Go back to My Collections</Link>
        </Button>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="text-center py-10">
        <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Collection not found.</h2>
         <Button asChild variant="link" className="mt-4">
          <Link href="/discover"><ArrowLeft className="mr-2 h-4 w-4" /> Go back to My Collections</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user && collectionData.owner === user.uid;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/discover">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Collections
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden shadow-lg">
        {collectionData.image ? (
          <Image
            src={collectionData.image}
            alt={collectionData.title}
            width={1200}
            height={400}
            className="w-full h-64 object-cover"
            data-ai-hint="collection banner abstract"
          />
        ) : (
          <div className="w-full h-64 bg-muted flex items-center justify-center" data-ai-hint="placeholder abstract">
            <ImageOff className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-4xl font-headline">{collectionData.title}</CardTitle>
          {ownerProfile && (
            <p className="text-sm text-muted-foreground">
              By {ownerProfile.profile_name} (@{ownerProfile.username})
            </p>
          )}
          {collectionData.description && (
            <CardDescription className="text-lg pt-2">{collectionData.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
      
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Link</CardTitle>
          </CardHeader>
          <CardContent>
            <AddLinkForm
              collectionId={collectionData.id}
              collectionOwnerId={collectionData.owner}
              onLinkAdded={handleLinkAdded}
            />
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="text-3xl font-semibold mb-6 flex items-center">
          <LinkIconFeather className="mr-3 h-7 w-7 text-primary" /> Links in this Collection ({links.length})
        </h2>
        {links.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map(link => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            This collection doesn't have any links yet.
            {isOwner ? " Add your first one using the form above!" : ""}
          </p>
        )}
      </section>
    </div>
  );
}
