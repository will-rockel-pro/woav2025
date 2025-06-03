
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Collection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Link as LinkIconLucide, PlusCircle, FolderOpen } from 'lucide-react'; // Renamed LinkIcon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL (e.g., https://example.com)' }),
  title: z.string().optional(),
  description: z.string().optional(),
  collectionAction: z.enum(['existing', 'new']),
  existingCollectionId: z.string().optional(),
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
    if (data.collectionAction === 'existing' && !data.existingCollectionId) {
        return false;
    }
    return true;
}, {
    message: 'Please select an existing collection.',
    path: ['existingCollectionId'],
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
  
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionAction: 'existing',
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
        if (collectionsData.length > 0 && collectionAction === 'existing') {
            setValue('existingCollectionId', collectionsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        toast({ title: 'Error', description: 'Could not fetch your collections.', variant: 'destructive' });
      } finally {
        setLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [userId, toast, setValue, collectionAction]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormError(null);
    setFormSuccess(null);
    let targetCollectionId = data.existingCollectionId;
    let collectionNameForToast = userCollections.find(c => c.id === targetCollectionId)?.title;


    try {
      if (data.collectionAction === 'new') {
        if (!data.newCollectionTitle || data.newCollectionTitle.trim() === '') {
            setFormError('New collection title cannot be empty.'); // Should be caught by Zod, but good fallback.
            toast({title: "Validation Error", description: "New collection title cannot be empty.", variant: "destructive"})
            return;
        }
        collectionNameForToast = data.newCollectionTitle.trim();
        const newCollectionRef = await addDoc(collection(db, 'collections'), {
          title: data.newCollectionTitle.trim(),
          description: '', 
          owner: userId,
          published: false, 
          collaborators: [],
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          image: '',
        });
        targetCollectionId = newCollectionRef.id;
        toast({ title: 'Collection Created', description: `Collection "${data.newCollectionTitle.trim()}" created.` });
      }

      if (!targetCollectionId) {
        setFormError('No collection selected or created. Please select or provide a title for a new collection.');
        toast({title: "Validation Error", description: "Please select a collection or provide a name for a new one.", variant: "destructive"})
        return;
      }

      const newLinkData = {
        collectionId: targetCollectionId,
        url: data.url,
        title: data.title?.trim() || '',
        description: data.description?.trim() || '',
        favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(data.url)}`,
        createdAt: serverTimestamp() as Timestamp,
        addedBy: userId,
      };
      await addDoc(collection(db, 'links'), newLinkData);

      setFormSuccess(`Link added to "${collectionNameForToast || 'your collection'}"!`);
      toast({ title: 'Link Added!', description: 'Your link has been successfully saved.'});
      
      router.push(`/collections/${targetCollectionId}`);

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
        <CardDescription>Organize your web discoveries. Add a URL and choose or create a collection.</CardDescription>
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
            <Label>Choose Collection</Label>
            <RadioGroup
              value={collectionAction}
              onValueChange={(value: 'existing' | 'new') => setValue('collectionAction', value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="font-normal cursor-pointer flex items-center"><FolderOpen className="mr-2 h-4 w-4"/>Existing Collection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="font-normal cursor-pointer flex items-center"><PlusCircle className="mr-2 h-4 w-4"/>Create New Collection</Label>
              </div>
            </RadioGroup>
          </div>

          {collectionAction === 'existing' && (
            <div className="space-y-2">
              <Label htmlFor="existingCollectionIdSelect">Select Collection</Label>
              {loadingCollections ? <p>Loading collections...</p> : (
                userCollections.length > 0 ? (
                  <Select 
                    onValueChange={(value) => setValue('existingCollectionId', value, {shouldValidate: true})} 
                    defaultValue={userCollections[0]?.id} // Set default if collections exist
                    name="existingCollectionId"
                   >
                    <SelectTrigger id="existingCollectionIdSelect">
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {userCollections.map(col => (
                        <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">You don't have any collections yet. Choose "Create New Collection".</p>
                )
              )}
              {errors.existingCollectionId && <p className="text-sm text-destructive">{errors.existingCollectionId.message}</p>}
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
