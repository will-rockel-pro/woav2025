
'use client';

import AddLinkGlobalForm from '@/components/AddLinkGlobalForm';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddLinkPage() {
  const { user, loading } = useAuthStatus();

  if (loading) {
    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold mb-2">Add New Link</CardTitle>
                    <CardDescription>Organize your web discoveries by adding links to your collections.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Loading user information...</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Card className="max-w-md mx-auto p-6">
          <CardTitle className="text-2xl mb-4">Access Denied</CardTitle>
          <CardDescription className="mb-6">
            You need to be signed in to add new links.
          </CardDescription>
          <Button asChild>
            <Link href="/auth/signin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Sign In
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <AddLinkGlobalForm userId={user.uid} />
    </div>
  );
}
