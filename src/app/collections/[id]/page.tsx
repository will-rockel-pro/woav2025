
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, Timestamp, addDoc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Collection, Link as LinkType, UserProfile } from '@/types';
import Image from 'next/image';
import LinkCard from '@/components/LinkCard';
import AddLinkForm from '@/components/AddLinkForm';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Info, Link as LinkIconFeather, ImageOff, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EnrichedLink extends LinkType {
  id: string;
}

export default function CollectionPage() {
  const paramsHook = useParams();
  const collectionIdFromParams = paramsHook.id as string; 

  const { user, loading: authLoading } = useAuthStatus();
  const [collectionData, setCollectionData] = useState<Collection | null>(null);
  const [links, setLinks] = useState<EnrichedLink[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  const fetchCollectionAndLinks = useCallback(async () => {
    if (!collectionIdFromParams) return;
    setLoading(true);
    setError(null);

    try {
      const collectionDocRef = doc(db, 'collections', collectionIdFromParams);
      const collectionDocSnap = await getDoc(collectionDocRef);

      if (!collectionDocSnap.exists()) {
        setError('Collection not found.');
        setCollectionData(null);
        setLoading(false);
        return;
      }

      const fetchedCollection = { id: collectionDocSnap.id, ...collectionDocSnap.data() } as Collection;
      setCollectionData(fetchedCollection);

      if (fetchedCollection.owner) {
        const ownerDocRef = doc(db, 'users', fetchedCollection.owner);
        const ownerDocSnap = await getDoc(ownerDocRef);
        if (ownerDocSnap.exists()) {
          setOwnerProfile(ownerDocSnap.data() as UserProfile);
        }
      }

      const linksQuery = query(
        collection(db, 'links'),
        where('collectionId', '==', collectionIdFromParams)
        // Temporarily removed orderBy to avoid index issues until explicitly requested
        // orderBy('createdAt', 'desc') 
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
  }, [collectionIdFromParams]); 

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !user) {
      console.error("Image upload preconditions not met: Missing imageFile or user.", { hasImageFile: !!imageFile, hasUser: !!user });
      toast({ title: 'Error', description: 'Cannot upload image. Missing file or user session.', variant: 'destructive'});
      return;
    }

    if (!collectionIdFromParams) {
        console.error("Collection ID from params is missing, cannot upload image.");
        toast({ title: 'Error', description: 'Collection ID is missing.', variant: 'destructive'});
        return;
    }
    
    const storagePath = `collection_images/${collectionIdFromParams}/${imageFile.name}`;

    console.log("Attempting image upload with the following details:");
    console.log("Current User UID:", user.uid);
    console.log("Target Collection ID (from URL params):", collectionIdFromParams);
    console.log("Storage Path:", storagePath);


    setUploadingImage(true);
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const collectionDocRef = doc(db, 'collections', collectionIdFromParams);
      
      await updateDoc(collectionDocRef, {
        image: downloadURL,
        updatedAt: serverTimestamp(),
      });

      setCollectionData(prevData => {
        if (prevData && prevData.id === collectionIdFromParams) {
          return {
            ...prevData,
            image: downloadURL,
            updatedAt: Timestamp.now(), 
          };
        }
        // Fallback if prevData is null or mismatched
        return {
            id: collectionIdFromParams,
            title: prevData?.title || 'Loading title...',
            description: prevData?.description,
            owner: prevData?.owner || user.uid,
            published: prevData?.published || false,
            collaborators: prevData?.collaborators || [],
            createdAt: prevData?.createdAt || Timestamp.now(),
            image: downloadURL,
            updatedAt: Timestamp.now(),
        };
      });
      setImageFile(null);
      toast({ title: 'Image uploaded successfully!' });
    } catch (err: any)
     {
      console.error('Error uploading image:', err);
      toast({ title: 'Error uploading image', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLinkAdded = (newLink: EnrichedLink) => {
    setLinks(prevLinks => [newLink, ...prevLinks]); // Add new link to the beginning of the list
  };

  useEffect(() => {
    if (collectionIdFromParams) {
        fetchCollectionAndLinks();
    }
  }, [collectionIdFromParams, fetchCollectionAndLinks]);


  if (authLoading || (loading && !collectionData)) { 
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
        <h2 className="text-xl font-semibold">Collection not found or still loading.</h2>
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
         {isOwner && (
          <CardContent className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Collection Image</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-grow w-full sm:w-auto">
                 <Label htmlFor="collection-image" className="sr-only">Choose image</Label>
                 <Input
                  id="collection-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
               <Button onClick={handleImageUpload} disabled={!imageFile || uploadingImage}>
                {uploadingImage ? (
                   <> <UploadCloud className="mr-2 h-4 w-4 animate-pulse" /> Uploading... </>
                 ) : (<> <UploadCloud className="mr-2 h-4 w-4" /> Update Image </>)}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      
      {isOwner && collectionData.id && collectionData.owner &&( 
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
            {links.map(linkItem => (
              <LinkCard key={linkItem.id} link={linkItem} />
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

