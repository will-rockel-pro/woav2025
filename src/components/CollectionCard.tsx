import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Collection, UserProfile } from '@/types';
import { Eye, UserCircle, Layers } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  owner?: UserProfile | null; // Optional owner details
}

export default function CollectionCard({ collection, owner }: CollectionCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <Link href={`/collections/${collection.id}`} className="block">
          <Image
            src={collection.image || `https://placehold.co/600x400.png?text=${encodeURIComponent(collection.title)}`}
            alt={collection.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint="abstract geometric"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-1 font-headline">
          <Link href={`/collections/${collection.id}`} className="hover:text-primary transition-colors">
            {collection.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 mb-2">
          {collection.description || 'No description available.'}
        </CardDescription>
        {owner && (
          <div className="text-xs text-muted-foreground flex items-center mt-2">
            <UserCircle className="w-4 h-4 mr-1.5" />
            <span>By {owner.profile_name} (@{owner.username})</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/collections/${collection.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Collection
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
