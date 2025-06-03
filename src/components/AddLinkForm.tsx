
'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Link as LinkType, Collection } from '@/types';
import { AlertCircle, CheckCircle, PlusCircle, FolderOpen, ChevronsUpDown, LinkIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AddLinkFormProps {
  collectionId: string; // ID of the current collection
  collectionOwnerId: string;
  onLinkAdded: (newLink: LinkType) => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ collectionId, collectionOwnerId, onLinkAdded }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [otherUserCollections, setOtherUserCollections] = useState<Collection[]>([]);
  const [loadingOtherCollections, setLoadingOtherCollections] = useState(true);
  const [selectedAdditionalCollectionIds, setSelectedAdditionalCollectionIds] = useState<Set<string>>(new Set());
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);

  const { user, loading: authLoading } = useAuthStatus();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserCollections = async () => {
      if (!user?.uid) return;
      setLoadingOtherCollections(true);
      try {
        const q = query(collection(db, 'collections'), where('owner', '==', user.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const collectionsData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Collection))
          .filter(col => col.id !== collectionId); // Exclude the current collection
        setOtherUserCollections(collectionsData);
      } catch (error) {
        console.error('Error fetching other collections:', error);
        toast({ title: 'Error', description: 'Could not fetch your other collections.', variant: 'destructive' });
      } finally {
        setLoadingOtherCollections(false);
      }
    };

    if (user) {
      fetchUserCollections();
    }
  }, [user, collectionId, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!url.trim()) {
      setFormError('URL is required.');
      return;
    }
    try {
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
    // The parent component CollectionPage already verifies ownership for displaying the form.
    // This is an additional safeguard if this component were used elsewhere.
    if (user.uid !== collectionOwnerId) {
        setFormError('You are not the owner of this collection.');
        toast({ title: "Permission Denied", description: "You do not have permission to add links here.", variant: "destructive" });
        return;
    }


    setSubmitting(true);
    const linkTitle = title.trim() || url;
    const linkDescription = description.trim() || '';
    const favicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
    let allAddedToCollectionsNames: string[] = [];
    let createdLinkForCurrentPage: LinkType | null = null;

    try {
      // 1. Add to the current collection
      const currentCollectionDoc = otherUserCollections.find(c => c.id === collectionId) || 
                                   (await getDocs(query(collection(db, 'collections'), where('__name__', '==', collectionId)))).docs[0]?.data() as Collection | undefined;
      
      const currentCollectionName = currentCollectionDoc?.title || "Current Collection";


      const newLinkDataCurrent: Omit<LinkType, 'id'> = {
        collectionId,
        url,
        title: linkTitle,
        description: linkDescription,
        favicon,
        createdAt: serverTimestamp() as Timestamp,
        addedBy: user.uid,
      };
      const currentDocRef = await addDoc(collection(db, 'links'), newLinkDataCurrent);
      createdLinkForCurrentPage = { ...newLinkDataCurrent, id: currentDocRef.id, createdAt: new Timestamp(Math.floor(Date.now() / 1000), 0) };
      allAddedToCollectionsNames.push(currentCollectionName);
      onLinkAdded(createdLinkForCurrentPage); // Update UI for current collection

      // 2. Add to selected additional existing collections
      for (const additionalColId of selectedAdditionalCollectionIds) {
        if (additionalColId === collectionId) continue; // Already added
        const newLinkDataAdditional: Omit<LinkType, 'id'> = {
          collectionId: additionalColId,
          url, title: linkTitle, description: linkDescription, favicon,
          createdAt: serverTimestamp() as Timestamp,
          addedBy: user.uid,
        };
        await addDoc(collection(db, 'links'), newLinkDataAdditional);
        const col = otherUserCollections.find(c => c.id === additionalColId);
        if (col) allAddedToCollectionsNames.push(col.title);
      }

      // 3. Create new collection and add link if title provided
      if (newCollectionTitle.trim()) {
        const newColName = newCollectionTitle.trim();
        const newCollectionRef = await addDoc(collection(db, 'collections'), {
          title: newColName,
          description: '',
          owner: user.uid,
          published: false,
          collaborators: [],
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          image: '',
        });
        const newLinkDataForNewCol: Omit<LinkType, 'id'> = {
          collectionId: newCollectionRef.id,
          url, title: linkTitle, description: linkDescription, favicon,
          createdAt: serverTimestamp() as Timestamp,
          addedBy: user.uid,
        };
        await addDoc(collection(db, 'links'), newLinkDataForNewCol);
        allAddedToCollectionsNames.push(newColName);
        toast({ title: 'Collection Created', description: `Collection "${newColName}" created.` });
      }

      const successMsg = `Link added to: ${allAddedToCollectionsNames.join(', ')}.`;
      setFormSuccess(successMsg);
      toast({ title: 'Link Added!', description: successMsg });

      // Reset form fields
      setUrl('');
      setTitle('');
      setDescription('');
      setSelectedAdditionalCollectionIds(new Set());
      setNewCollectionTitle('');

    } catch (err: any) {
      console.error('Error adding link(s):', err);
      setFormError(err.message || 'Failed to add link. Please try again.');
      toast({ title: 'Error Adding Link', description: err.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setFormError(null);
        setFormSuccess(null);
      }, 7000);
    }
  };

  if (authLoading) return <p>Checking authentication...</p>;
  if (!user) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Not Signed In</AlertTitle>
      <AlertDescription>You need to be signed in to perform this action.</AlertDescription>
    </Alert>
  );
   if (user.uid !== collectionOwnerId) return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Permission Denied</AlertTitle>
      <AlertDescription>Only the collection owner can add links to this collection.</AlertDescription>
    </Alert>
  );


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
        <Label htmlFor="url-local">Link URL* (will be added to current collection)</Label>
        <Input type="url" id="url-local" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-title-local">Title (Optional)</Label>
        <Input type="text" id="link-title-local" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Awesome Article Name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-description-local">Description (Optional)</Label>
        <Textarea id="link-description-local" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A short summary of the link." />
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <h3 className="text-md font-medium text-muted-foreground">Optionally, also add to:</h3>
        
        <div className="space-y-2">
          <Label htmlFor="additionalCollections">Other existing collection(s)</Label>
          {loadingOtherCollections ? <p className="text-sm text-muted-foreground">Loading other collections...</p> : (
            otherUserCollections.length > 0 ? (
              <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={multiSelectOpen} className="w-full justify-between font-normal">
                    {selectedAdditionalCollectionIds.size > 0 ? `${selectedAdditionalCollectionIds.size} other collection(s) selected` : "Select other collections..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search collections..." />
                    <CommandList>
                      <CommandEmpty>No other collections found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-48">
                          {otherUserCollections.map(col => (
                            <CommandItem
                              key={col.id}
                              value={col.title}
                              onSelect={() => {
                                setSelectedAdditionalCollectionIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(col.id)) newSet.delete(col.id);
                                  else newSet.add(col.id);
                                  return newSet;
                                });
                              }}
                              className="cursor-pointer"
                            >
                              <Checkbox checked={selectedAdditionalCollectionIds.has(col.id)} className="mr-2" />
                              {col.title}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm text-muted-foreground">You don't have any other collections.</p>
            )
          )}
        </div>

        <div className="flex items-center space-x-2">
            <Separator className="flex-grow" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-grow" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newCollectionTitle-local">Create a new collection named:</Label>
          <Input 
            id="newCollectionTitle-local" 
            placeholder="e.g., My New Finds" 
            value={newCollectionTitle}
            onChange={(e) => setNewCollectionTitle(e.target.value)}
            disabled={selectedAdditionalCollectionIds.size > 0 && !newCollectionTitle.trim()} 
          />
           {selectedAdditionalCollectionIds.size > 0 && newCollectionTitle.trim() && (
             <p className="text-xs text-destructive">Note: Adding to existing collections will take precedence over creating a new one if both are specified.</p>
           )}
        </div>
      </div>
      
      <Button type="submit" disabled={submitting || !url.trim()} className="w-full sm:w-auto">
        {submitting ? 'Adding Link(s)...' : 'Add Link to Collection(s)'}
      </Button>
    </form>
  );
};

export default AddLinkForm;

