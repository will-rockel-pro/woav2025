
'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Link as LinkType } from '@/types'; // Import your Link type
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface AddLinkFormProps {
  collectionId: string;
  collectionOwnerId: string;
  onLinkAdded: (newLink: LinkType) => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ collectionId, collectionOwnerId, onLinkAdded }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuthStatus();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!url.trim()) {
      setFormError('URL is required.');
      return;
    }
    try {
      // Basic URL validation
      new URL(url);
    } catch (_) {
      setFormError('Invalid URL format. Please include http:// or https://');
      return;
    }

    if (authLoading) {
      setFormError('Authentication check in progress. Please wait.');
      return;
    }

    if (!user) {
      setFormError('You must be signed in to add links.');
      toast({ title: "Authentication Error", description: "Please sign in.", variant: "destructive" });
      return;
    }

    if (user.uid !== collectionOwnerId) {
      setFormError('You are not the owner of this collection.');
      toast({ title: "Permission Denied", description: "Only the collection owner can add links.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const newLinkData: Omit<LinkType, 'id'> = { // Omit id as Firestore generates it
        collectionId,
        url,
        title: title.trim() || '', // Use URL if title is empty later, or fetch
        description: description.trim() || '',
        favicon: '', // Can be fetched later or use a default
        createdAt: serverTimestamp() as Timestamp, // Cast to avoid type issues before server write
        addedBy: user.uid,
      };

      const docRef = await addDoc(collection(db, 'links'), newLinkData);
      
      // Construct the new link with the ID for UI update
      const createdLink: LinkType = {
        ...newLinkData,
        id: docRef.id,
        createdAt: new Timestamp(Date.now() / 1000, 0) // Approximate client-side timestamp for immediate UI
      };

      onLinkAdded(createdLink); // Callback to update parent component's state

      setFormSuccess(`Link "${title || url}" added successfully!`);
      toast({
        title: 'Link Added!',
        description: `"${title.trim() || url}" has been added to the collection.`,
      });
      
      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');

    } catch (err: any) {
      console.error('Error adding link:', err);
      setFormError(err.message || 'Failed to add link. Please try again.');
      toast({
        title: 'Error Adding Link',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      // Clear success/error messages after a delay
      setTimeout(() => {
        setFormError(null);
        setFormSuccess(null);
      }, 5000);
    }
  };

  if (authLoading) {
    return <p>Checking authentication...</p>;
  }

  // Note: The parent component `CollectionPage` already checks if the current user is the owner
  // before rendering this form. This is an additional safeguard or for potential direct use.
  if (user && user.uid !== collectionOwnerId) {
     return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>
            Only the collection owner can add links to this collection.
            </AlertDescription>
        </Alert>
     );
  }
   if (!user) {
     return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Signed In</AlertTitle>
            <AlertDescription>
            You need to be signed in to add links.
            </AlertDescription>
        </Alert>
     );
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      {formSuccess && (
         <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4 !text-green-500" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="url">Link URL*</Label>
        <Input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="https://example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-title">Title (Optional)</Label>
        <Input
          type="text"
          id="link-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Awesome Article Name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-description">Description (Optional)</Label>
        <Textarea
          id="link-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A short summary of the link."
        />
      </div>
      <Button
        type="submit"
        disabled={loading || !url.trim()}
        className="w-full sm:w-auto"
      >
        {loading ? 'Adding Link...' : 'Add Link to Collection'}
      </Button>
    </form>
  );
};

export default AddLinkForm;
