
"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { useRouter } from 'next/navigation';

const CreateCollectionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, authLoading, authError] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError('You must be signed in to create a collection.');
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create a collection.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'collections'), {
        title,
        description,
        owner: user.uid, // Changed from userId to owner
        published: false, // Default to not published
        collaborators: [], // Default to empty array
        createdAt: serverTimestamp(), // Use server timestamp
        updatedAt: serverTimestamp(), // Use server timestamp
        image: '', // Default empty image, can be updated later
      });
      setTitle('');
      setDescription('');
      toast({
        title: "Collection Created!",
        description: `Your new collection "${title}" has been successfully created.`,
      });
      console.log('Collection created successfully with ID: ', docRef.id);
            router.push(`/collections/${docRef.id}`); // Redirect to the new collection's page
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error Creating Collection",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error('Error creating collection:', err);
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
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., My Favorite Recipes, Travel Ideas"
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
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Collection'}
          </Button>
          {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateCollectionForm;
