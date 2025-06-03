
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileBioEditorProps {
  userId: string;
  currentBio: string;
}

const MAX_BIO_LENGTH = 280;

export default function ProfileBioEditor({ userId, currentBio }: ProfileBioEditorProps) {
  const [bio, setBio] = useState(currentBio);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const remainingChars = MAX_BIO_LENGTH - bio.length;

  useEffect(() => {
    setBio(currentBio); // Sync with prop changes if any
  }, [currentBio]);

  const handleSaveBio = async () => {
    if (bio.length > MAX_BIO_LENGTH) {
      toast({
        title: 'Bio Too Long',
        description: `Your bio cannot exceed ${MAX_BIO_LENGTH} characters.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        bio: bio.trim(),
      });
      toast({ title: 'Bio Updated!', description: 'Your profile bio has been saved.' });
      setEditing(false);
      router.refresh(); // Re-fetch server components to show updated bio
    } catch (error: any) {
      console.error('Error updating bio:', error);
      toast({ title: 'Save Failed', description: error.message || 'Could not save bio.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Profile Bio</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Bio
            </Button>
        </div>
        {currentBio ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentBio}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No bio set yet. Click "Edit Bio" to add one.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Edit Profile Bio</h3>
      <div className="space-y-2">
        <Label htmlFor="profile-bio" className="sr-only">Your Bio</Label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a little about yourself..."
          rows={4}
          maxLength={MAX_BIO_LENGTH + 20} // Allow slight overtyping before validation
          disabled={saving}
          className="text-sm"
        />
        <p className={`text-xs ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {remainingChars} character{remainingChars === 1 || remainingChars === -1 ? '' : 's'} remaining
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={handleSaveBio} disabled={saving || bio === currentBio || remainingChars < 0}>
          {saving ? (
            <><Save className="mr-2 h-4 w-4 animate-pulse" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Bio</>
          )}
        </Button>
        <Button variant="outline" onClick={() => { setEditing(false); setBio(currentBio); }} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
