
"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';

const CreateCollectionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { auth, db, storage } = useFirebaseServices();
  const [user, authLoading, authError] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be signed in to create a collection.');
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create a collection.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let collectionId = '';

    try {
      // Step 1: Create the collection document in Firestore
      const collectionData: {
        title: string;
        description: string;
        owner: string;
        published: boolean;
        collaborators: string[];
        createdAt: Timestamp;
        updatedAt: Timestamp;
        image: string; 
      } = {
        title,
        description,
        owner: user.uid,
        published: false, 
        collaborators: [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        image: '', 
      };
      
      const docRef = await addDoc(collection(db, 'collections'), collectionData);
      collectionId = docRef.id;
      console.log('Collection created with ID: ', collectionId);

      // Step 2: If an image file is selected, upload it and update the collection
      if (imageFile) {
        toast({
          title: "Collection Created",
          description: `"${title}" created. Now uploading image...`,
        });
        const storagePath = `collection_images/${collectionId}/${imageFile.name}`;
        const imageStorageRef = ref(storage, storagePath);
        
        // Add customMetadata for security rules
        const fileMetadata = { customMetadata: { 'owner_uid': user.uid } };
        const snapshot = await uploadBytes(imageStorageRef, imageFile, fileMetadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Image uploaded, URL: ', downloadURL);

        // Step 3: Update the collection document with the image URL
        await updateDoc(doc(db, 'collections', collectionId), {
          image: downloadURL,
          updatedAt: serverTimestamp(),
        });
        console.log('Collection updated with image URL.');
      }

      toast({
        title: "Collection Created Successfully!",
        description: `Your new collection "${title}" has been created ${imageFile ? 'with an image' : ''}.`,
      });
      
      setTitle('');
      setDescription('');
      setImageFile(null);
      
      // Redirect to the new collection's page
      router.push(`/collections/${collectionId}`);

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error during collection creation",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error('Error during collection creation process:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <p>Loading user authentication status...</p>;
  }

  if (authError) {
    return <p>Error loading user: {authError.message}</p>;
  }

  if (!user) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Create Collection</CardTitle>
          <CardDescription>Please sign in to create a new collection.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Create New Collection</CardTitle>
        <CardDescription>Fill in the details below to start your new collection.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title*</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., My Favorite Recipes, Travel Ideas"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A brief description of what this collection is about."
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-image">Collection Image (Optional)</Label>
            <Input
              type="file"
              id="collection-image"
              accept="image/*"
              onChange={handleImageChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={loading}
            />
            {imageFile && (
              <p className="text-sm text-muted-foreground">Selected: {imageFile.name}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !title.trim() || authLoading}
            className="w-full"
          >
            {loading ? (
              <>
                <UploadCloud className="mr-2 h-4 w-4 animate-pulse" />
                Creating Collection...
              </>
            ) : (
              'Create Collection'
            )}
          </Button>
          {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateCollectionForm;
