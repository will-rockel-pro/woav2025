"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth"; // Import the sign-in function
import { auth } from "@/lib/firebase"; // Import your initialized Firebase auth instance
import SignInButton from '@/components/auth/SignInButton'; // Assuming this is your Google Sign-In button
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Adjust imports based on your actual components
import Logo from '@/components/Logo'; // Assuming this is your Logo component

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // State for handling errors

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Sign-in successful, you can redirect the user or update UI
      console.log("User signed in with email and password!");
      // Example: Redirect to home page
      // window.location.href = "/"; 
    } catch (error: any) {
      setError(error.message); // Display error message
      console.error("Error signing in with email and password:", error);
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
            Access your collections and discover new content by signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Your existing Google Sign-In button */}
          <SignInButton /> 

          {/* Manual Email and Password Sign-In Form */}
          <form onSubmit={handleEmailSignIn} className="flex flex-col space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In with Email
            </button>
            {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>} {/* Display error */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
