
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
import { ArrowLeft, Info, Link as LinkIconFeather, ImageOff, UploadCloud, Eye, EyeOff } from 'lucide-react'; // Globe removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import NextLink from 'next/link'; // Renamed to avoid conflict with LinkType
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    setCollectionData(null); // Reset on new fetch

    try {
      const collectionDocRef = doc(db, 'collections', collectionIdFromParams);
      const collectionDocSnap = await getDoc(collectionDocRef);

      if (!collectionDocSnap.exists()) {
        setError('Collection not found.');
        setLoading(false);
        return;
      }

      const fetchedCollection = { id: collectionDocSnap.id, ...collectionDocSnap.data() } as Collection;
      
      const isPublic = fetchedCollection.published === true;
      const isOwner = user?.uid === fetchedCollection.owner;

      if (!isPublic && !isOwner) {
        setError('This collection is private or you do not have permission to view it.');
        setLoading(false);
        return;
      }
      
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
  }, [collectionIdFromParams, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleImageUpload = async () => {
    if (!user?.uid || !collectionIdFromParams || !imageFile || !collectionData?.owner) {
      toast({ title: 'Error', description: 'Cannot upload image. Missing required data or user session.', variant: 'destructive'});
      return;
    }

    const storagePath = `collection_images/${collectionIdFromParams}/${imageFile.name}`;
    const collectionDocRefForUpdate = doc(db, 'collections', collectionIdFromParams);
    const fileMetadata = { customMetadata: { 'owner_uid': collectionData.owner } };

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, imageFile, fileMetadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateDoc(collectionDocRefForUpdate, {
        image: downloadURL,
        updatedAt: serverTimestamp(),
      });

      setCollectionData(prevData => {
        const baseData = prevData || { id: collectionIdFromParams, title: '', owner: user.uid, published: false, collaborators: [], createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
        return { ...baseData, image: downloadURL, updatedAt: Timestamp.now() };
      });

      setImageFile(null);
      toast({ title: 'Image uploaded successfully!' });
    } catch (err: any) {
      console.error('Error during image upload or Firestore update:', err);
      toast({ title: 'Error uploading image', description: `Code: ${err.code || 'N/A'} | Message: ${err.message}`, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublishToggle = async (isPublished: boolean) => {
    if (!collectionData || !user || user.uid !== collectionData.owner) {
      toast({ title: 'Error', description: 'You do not have permission to change this setting.', variant: 'destructive' });
      return;
    }

    const collectionDocRef = doc(db, 'collections', collectionData.id);
    try {
      await updateDoc(collectionDocRef, {
        published: isPublished,
        updatedAt: serverTimestamp(),
      });
      setCollectionData(prev => prev ? { ...prev, published: isPublished, updatedAt: Timestamp.now() } : null);
      toast({
        title: 'Visibility Updated',
        description: `Collection is now ${isPublished ? 'public' : 'private'}.`,
      });
    } catch (err: any) {
      console.error('Error updating collection visibility:', err);
      toast({ title: 'Error', description: 'Failed to update collection visibility.', variant: 'destructive' });
      // Revert local state if Firestore update fails
      setCollectionData(prev => prev ? { ...prev, published: !isPublished } : null);
    }
  };

  const handleLinkAdded = (newLink: EnrichedLink) => {
    setLinks(prevLinks => [newLink, ...prevLinks]);
  };

  useEffect(() => {
    if (collectionIdFromParams) {
        fetchCollectionAndLinks();
    }
  }, [collectionIdFromParams, fetchCollectionAndLinks]);


  if (authLoading || (loading && !collectionData && !error)) {
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
          <NextLink href="/discover"><ArrowLeft className="mr-2 h-4 w-4" /> Go back to Discover</NextLink>
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
          <NextLink href="/discover"><ArrowLeft className="mr-2 h-4 w-4" /> Go back to Discover</NextLink>
        </Button>
      </div>
    );
  }

  const isOwner = user && collectionData.owner === user.uid;

  return (
    <div className="space-y-8 pt-6">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-4xl font-headline mb-2 sm:mb-0">{collectionData.title}</CardTitle>
            {/* Public badge removed */}
            {collectionData.published !== true && isOwner && (
                 <Badge variant="secondary" className="w-fit">
                    <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Private Collection
                </Badge>
            )}
          </div>
          {ownerProfile && (
            <p className="text-sm text-muted-foreground mt-1">
              By {ownerProfile.profile_name} (@{ownerProfile.username})
            </p>
          )}
          {collectionData.description && (
            <CardDescription className="text-lg pt-2">{collectionData.description}</CardDescription>
          )}
        </CardHeader>
         {isOwner && (
          <CardContent className="border-t pt-6 space-y-6">
            <div>
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
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Visibility</h3>
               <div className="flex items-center space-x-3">
                <Switch
                  id="publish-collection"
                  checked={collectionData.published === true}
                  onCheckedChange={handlePublishToggle}
                  aria-label={collectionData.published === true ? 'Make collection private' : 'Make collection public'}
                />
                <Label htmlFor="publish-collection" className="flex items-center cursor-pointer">
                  {collectionData.published === true ? (
                    <><Eye className="mr-2 h-4 w-4" /> Public (Visible to everyone)</>
                  ) : (
                    <><EyeOff className="mr-2 h-4 w-4" /> Private (Visible only to you and collaborators)</>
                  )}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {collectionData.published === true 
                  ? "This collection is currently public and can be seen by anyone."
                  : "This collection is currently private."}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {isOwner && collectionData.id && collectionData.owner && (
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
    

    

    
