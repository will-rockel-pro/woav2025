
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Collection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Link as LinkIconLucide, PlusCircle, FolderOpen, ChevronsUpDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL (e.g., https://example.com)' }),
  title: z.string().optional(),
  description: z.string().optional(),
  collectionAction: z.enum(['existing', 'new']),
  existingCollectionIds: z.array(z.string()).optional(),
  newCollectionTitle: z.string().optional(),
}).refine(data => {
  if (data.collectionAction === 'new' && (!data.newCollectionTitle || data.newCollectionTitle.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'New collection title is required if creating a new collection.',
  path: ['newCollectionTitle'],
}).refine(data => {
    if (data.collectionAction === 'existing' && (!data.existingCollectionIds || data.existingCollectionIds.length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Please select at least one existing collection.',
    path: ['existingCollectionIds'],
});

type FormData = z.infer<typeof formSchema>;

interface AddLinkGlobalFormProps {
  userId: string;
}

export default function AddLinkGlobalForm({ userId }: AddLinkGlobalFormProps) {
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [selectedUiCollectionIds, setSelectedUiCollectionIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const { toast } = useToast();
  const { db } = useFirebaseServices();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, control } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionAction: 'existing',
      existingCollectionIds: [],
    },
  });

  const collectionAction = watch('collectionAction');

  useEffect(() => {
    const fetchCollections = async () => {
      if (!userId) return;
      setLoadingCollections(true);
      try {
        const q = query(collection(db, 'collections'), where('owner', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const collectionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
        setUserCollections(collectionsData);
        if (collectionsData.length === 0 && collectionAction === 'existing') {
            setValue('collectionAction', 'new'); // Switch to new if no collections exist
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        toast({ title: 'Error', description: 'Could not fetch your collections.', variant: 'destructive' });
      } finally {
        setLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [userId, toast, setValue, collectionAction, db]);

  useEffect(() => {
    setValue('existingCollectionIds', Array.from(selectedUiCollectionIds), { shouldValidate: true, shouldDirty: true });
  }, [selectedUiCollectionIds, setValue]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormError(null);
    setFormSuccess(null);
    let targetCollectionIds: string[] = [];
    let collectionNamesForToast: string[] = [];
    let firstCollectionIdForRedirect: string | undefined;

    try {
      if (data.collectionAction === 'new') {
        if (!data.newCollectionTitle || data.newCollectionTitle.trim() === '') {
            setFormError('New collection title cannot be empty.');
            toast({title: "Validation Error", description: "New collection title cannot be empty.", variant: "destructive"})
            return;
        }
        const newCollectionName = data.newCollectionTitle.trim();
        const newCollectionRef = await addDoc(collection(db, 'collections'), {
          title: newCollectionName,
          description: '', 
          owner: userId,
          published: false, 
          collaborators: [],
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          image: '',
        });
        targetCollectionIds.push(newCollectionRef.id);
        collectionNamesForToast.push(newCollectionName);
        firstCollectionIdForRedirect = newCollectionRef.id;
        toast({ title: 'Collection Created', description: `Collection "${newCollectionName}" created.` });
      } else if (data.collectionAction === 'existing' && data.existingCollectionIds && data.existingCollectionIds.length > 0) {
        targetCollectionIds = data.existingCollectionIds;
        targetCollectionIds.forEach(id => {
          const col = userCollections.find(c => c.id === id);
          if (col) collectionNamesForToast.push(col.title);
        });
        if (targetCollectionIds.length > 0) {
            firstCollectionIdForRedirect = targetCollectionIds[0];
        }
      }

      if (targetCollectionIds.length === 0) {
        setFormError('No collection selected or created. Please select or provide a title for a new collection.');
        toast({title: "Validation Error", description: "Please select a collection or provide a name for a new one.", variant: "destructive"})
        return;
      }

      for (const collectionId of targetCollectionIds) {
        const newLinkData = {
          collectionId: collectionId,
          url: data.url,
          title: data.title?.trim() || data.url,
          description: data.description?.trim() || '',
          favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(data.url)}`,
          createdAt: serverTimestamp() as Timestamp,
          addedBy: userId,
        };
        await addDoc(collection(db, 'links'), newLinkData);
      }
      
      const successMessage = `Link added to ${collectionNamesForToast.join(', ')}!`;
      setFormSuccess(successMessage);
      toast({ title: 'Link Added!', description: `Your link has been successfully saved to ${collectionNamesForToast.length} collection(s).`});
      
      if (firstCollectionIdForRedirect) {
        router.push(`/collections/${firstCollectionIdForRedirect}`);
      } else {
        router.push('/discover'); // Fallback redirect
      }

    } catch (err: any) {
      console.error('Error in submission process:', err);
      setFormError(err.message || 'An unexpected error occurred.');
      toast({ title: 'Error', description: err.message || 'Failed to save link.', variant: 'destructive' });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline flex items-center"><LinkIconLucide className="mr-3 h-7 w-7 text-primary" /> Add New Link</CardTitle>
        <CardDescription>Organize your web discoveries. Add a URL and choose or create a collection(s).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            <Input id="url" placeholder="https://example.com" {...register('url')} />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input id="title" placeholder="e.g., Amazing Resource" {...register('title')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" placeholder="A brief summary of the link." {...register('description')} rows={3} />
          </div>

          <div className="space-y-3">
            <Label>Choose Collection Action</Label>
            <RadioGroup
              value={collectionAction}
              onValueChange={(value: 'existing' | 'new') => {
                setValue('collectionAction', value);
                if (value === 'new') {
                  setSelectedUiCollectionIds(new Set()); // Clear multi-select if switching to new
                }
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" disabled={userCollections.length === 0 && !loadingCollections}/>
                <Label htmlFor="existing" className={`font-normal cursor-pointer flex items-center ${userCollections.length === 0 && !loadingCollections ? 'text-muted-foreground cursor-not-allowed' : ''}`}><FolderOpen className="mr-2 h-4 w-4"/>Existing Collection(s)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="font-normal cursor-pointer flex items-center"><PlusCircle className="mr-2 h-4 w-4"/>Create New Collection</Label>
              </div>
            </RadioGroup>
          </div>

          {collectionAction === 'existing' && (
            <div className="space-y-2">
              <Label htmlFor="existingCollections">Select Collection(s)*</Label>
              {loadingCollections ? <p>Loading collections...</p> : (
                userCollections.length > 0 ? (
                  <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={multiSelectOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedUiCollectionIds.size > 0
                          ? `${selectedUiCollectionIds.size} collection(s) selected`
                          : "Select collections..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search collections..." />
                        <CommandList>
                          <CommandEmpty>No collections found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-48">
                              {userCollections.map(col => (
                                <CommandItem
                                  key={col.id}
                                  value={col.title} // Allow searching by title
                                  onSelect={() => {
                                    setSelectedUiCollectionIds(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(col.id)) {
                                        newSet.delete(col.id);
                                      } else {
                                        newSet.add(col.id);
                                      }
                                      return newSet;
                                    });
                                    // setMultiSelectOpen(false); // Keep open for multi-selection
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Checkbox
                                    checked={selectedUiCollectionIds.has(col.id)}
                                    className="mr-2"
                                    onCheckedChange={(checked) => {
                                       setSelectedUiCollectionIds(prev => {
                                        const newSet = new Set(prev);
                                        if (checked) newSet.add(col.id);
                                        else newSet.delete(col.id);
                                        return newSet;
                                      })
                                    }}
                                  />
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
                  <p className="text-sm text-muted-foreground">You don't have any collections yet. Choose "Create New Collection".</p>
                )
              )}
              {errors.existingCollectionIds && <p className="text-sm text-destructive">{errors.existingCollectionIds.message}</p>}
            </div>
          )}

          {collectionAction === 'new' && (
            <div className="space-y-2">
              <Label htmlFor="newCollectionTitle">New Collection Title*</Label>
              <Input id="newCollectionTitle" placeholder="e.g., My Awesome Finds" {...register('newCollectionTitle')} />
              {errors.newCollectionTitle && <p className="text-sm text-destructive">{errors.newCollectionTitle.message}</p>}
            </div>
          )}
          
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (collectionAction === 'new' ? 'Creating Collection & Saving Link...' : 'Saving Link...') : 'Save Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
