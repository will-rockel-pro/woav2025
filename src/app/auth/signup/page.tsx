
"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from '@/components/Logo';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      toast({ title: "Error", description: "Password should be at least 6 characters long.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Create user profile in Firestore
        const userRef = doc(db, "users", user.uid);
        const baseUsername = (user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/gi, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); 
        const username = `${baseUsername}${randomSuffix}`;

        const newUserProfile: UserProfile = {
          uuid: user.uid,
          username: username,
          profile_name: user.displayName || user.email?.split('@')[0] || 'New User', 
          profile_picture: user.photoURL || null,
        };
        await setDoc(userRef, newUserProfile);
        console.log(`[SignUpPage DEBUG] User profile created for ${user.uid}`);

        // Create a default "Reading List" collection
        const readingListCollectionData = {
          title: "Reading List",
          description: "A place to save articles and links to read later.",
          owner: user.uid,
          published: false, // Default to private
          collaborators: [],
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          image: '', // No default image
        };
        const readingListDocRef = await addDoc(collection(db, "collections"), readingListCollectionData);
        console.log(`[SignUpPage DEBUG] "Reading List" collection created for user ${user.uid}. Document ID: ${readingListDocRef.id}`);
        
        toast({ title: "Account Created!", description: "Welcome! Your account and 'Reading List' collection are ready." });
        
        // Attempt to create server session immediately after signup
        const idToken = await user.getIdToken(true);
        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[SignUp] API call to /api/auth/session-login FAILED. Status:', response.status, 'Error:', errorData.error);
          toast({ title: "Session Creation Failed", description: errorData.error || "Could not establish a server session post-signup.", variant: "destructive" });
        } else {
          console.log('[SignUp] API call to /api/auth/session-login SUCCEEDED post-signup.');
        }

        router.push("/discover"); 
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Sign Up Failed", description: err.message, variant: "destructive" });
      console.error("Error signing up:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            Join WOAV Lite to start curating your web discoveries.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </>
              )}
            </Button>
            {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/auth/signin">
                 Sign In <LogIn className="ml-1 h-3 w-3"/>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
