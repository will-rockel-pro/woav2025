
'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirebaseServices } from '@/components/layout/FirebaseProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileImageUploaderProps {
  userId: string;
  currentImageUrl?: string | null;
  userName?: string;
  onUploadSuccess: (newImageUrl: string) => void;
}

export default function ProfileImageUploader({ userId, currentImageUrl, userName, onUploadSuccess }: ProfileImageUploaderProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { db, storage } = useFirebaseServices();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !userId) {
      toast({ title: 'Error', description: 'No image selected or user ID missing.', variant: 'destructive' });
      return;
    }

    const storagePath = `profile_pictures/${userId}/${imageFile.name}`;
    const userDocRef = doc(db, 'users', userId);
    const fileMetadata = { customMetadata: { 'owner_uid': userId } };

    setUploading(true);
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, imageFile, fileMetadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateDoc(userDocRef, {
        profile_picture: downloadURL,
      });

      onUploadSuccess(downloadURL); // Notify parent component of the new URL

      setImageFile(null);
      setPreviewUrl(null);
      toast({ title: 'Profile Picture Updated!', description: 'Your new profile picture has been saved.' });
      router.refresh(); 
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({ title: 'Upload Failed', description: error.message || 'Could not upload image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Update Profile Picture</h3>
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <Avatar className="h-24 w-24 sm:h-20 sm:w-20">
          <AvatarImage src={previewUrl || currentImageUrl || undefined} alt={userName || 'User'} data-ai-hint="profile preview medium" />
          <AvatarFallback className="text-3xl">
            {previewUrl ? '' : (userName ? userName.charAt(0).toUpperCase() : <UserCircle />)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2 flex-grow w-full sm:w-auto">
          <Label htmlFor="profile-image-upload" className="sr-only">Choose profile image</Label>
          <Input
            id="profile-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
          {imageFile && (
            <Button onClick={handleImageUpload} disabled={uploading || !imageFile} className="w-full sm:w-auto">
              {uploading ? (
                <><UploadCloud className="mr-2 h-4 w-4 animate-pulse" /> Uploading...</>
              ) : (
                <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Save</>
              )}
            </Button>
          )}
        </div>
      </div>
      {!imageFile && currentImageUrl && (
         <p className="text-xs text-muted-foreground">Current image is shown. Select a new image to change it.</p>
      )}
       {!imageFile && !currentImageUrl && (
         <p className="text-xs text-muted-foreground">No profile picture set. Select an image to upload.</p>
      )}
    </div>
  );
}
