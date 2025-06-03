
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
import { UserPlus } from "lucide-react"; // For the sign up link

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Import and use useRouter if not already
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Signed In!", description: "Welcome back." });
      router.push("/discover"); 
    } catch (error: any) {
      setError(error.message);
      toast({ title: "Sign In Failed", description: error.message, variant: "destructive" });
      console.error("Error signing in with email and password:", error);
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

// Need to import useRouter if you use router.push()
import { useRouter } from 'next/navigation';
