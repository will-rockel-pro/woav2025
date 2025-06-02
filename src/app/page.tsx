import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bookmark, Search, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <Bookmark className="w-24 h-24 text-primary mb-6" />
      <h1 className="font-headline text-5xl font-bold mb-4">Welcome to WOAV Lite</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Your personal space to discover, save, and organize interesting finds from across the web.
        Start building your curated collections today.
      </p>
      <div className="flex space-x-4">
        <Button asChild size="lg">
          <Link href="/discover">
            <Search className="mr-2 h-5 w-5" /> Explore Collections
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">
            <Users className="mr-2 h-5 w-5" /> Join or Sign In
          </Link>
        </Button>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
          <Bookmark className="w-12 h-12 text-accent mb-3" />
          <h3 className="text-lg font-semibold mb-2">Curate Collections</h3>
          <p className="text-sm text-muted-foreground">Organize links into meaningful collections for easy access.</p>
        </div>
        <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
          <Search className="w-12 h-12 text-accent mb-3" />
          <h3 className="text-lg font-semibold mb-2">Discover Content</h3>
          <p className="text-sm text-muted-foreground">Find inspiring collections and links shared by the community.</p>
        </div>
        <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm">
          <Users className="w-12 h-12 text-accent mb-3" />
          <h3 className="text-lg font-semibold mb-2">Connect & Share</h3>
          <p className="text-sm text-muted-foreground">Follow users and collaborate on collections (coming soon).</p>
        </div>
      </div>
    </div>
  );
}
