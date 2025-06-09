
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SignInButton from '@/components/auth/SignInButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('[EmailSignIn] Attempting email sign-in for:', email); 
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        console.log('[EmailSignIn] Client-side Firebase sign-in successful. User UID:', user.uid);
        const idToken = await user.getIdToken(true);
        console.log('[EmailSignIn] ID token obtained (first 10 chars):', idToken.substring(0,10) + '...');

        console.log('[EmailSignIn] Calling /api/auth/session-login with ID token...');
        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });
        console.log('[EmailSignIn] /api/auth/session-login call completed. Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[EmailSignIn] API call to /api/auth/session-login FAILED. Status:', response.status, 'Error:', errorData.error);
          toast({ title: "Session Creation Failed", description: errorData.error || "Could not establish a server session.", variant: "destructive" });
        } else {
          const responseData = await response.json();
          console.log('[EmailSignIn] API call to /api/auth/session-login SUCCEEDED. Status:', response.status, 'Response Data:', responseData);
          toast({ title: "Signed In!", description: "Welcome back. Server session established." });
        }
        
        console.log('[EmailSignIn] Pushing to /discover and refreshing router...');
        router.push("/discover");
        router.refresh();
      } else {
        console.error('[EmailSignIn] User object not found after successful Firebase sign-in.');
        throw new Error("User object not found after successful sign-in.");
      }

    } catch (error: any) {
      console.error("[EmailSignIn] Error during email sign-in process:", error.message, error.code ? `(Code: ${error.code})` : '', error.stack);
      
      let displayMessage = "An unknown error occurred during sign-in. Please try again.";
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/user-not-found') {
        displayMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message) {
        displayMessage = error.message; // Fallback for other Firebase errors
      }

      setError(displayMessage);
      toast({ title: "Sign In Failed", description: displayMessage, variant: "destructive" });
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
          <CardTitle className="text-2xl font-headline">Sign In to WOAV Lite</CardTitle>
          <CardDescription>
            Access your collections and discover new content.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <SignInButton /> 

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email-signin">Email</Label>
              <Input
                type="email"
                id="email-signin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password-signin">Password</Label>
              <Input
                type="password"
                id="password-signin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In with Email"}
            </Button>
            {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
          </form>

          <div className="mt-2 text-center text-sm">
            Don't have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/auth/signup">
                Sign Up <UserPlus className="ml-1 h-3 w-3"/>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
