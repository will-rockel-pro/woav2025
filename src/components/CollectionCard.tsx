
import Image from 'next/image';
import NextLink from 'next/link'; // Renamed to avoid conflict
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Collection, UserProfile } from '@/types';
import { Eye, UserCircle, EyeOff } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface CollectionCardProps {
  collection: Collection;
  owner?: UserProfile | null; // Optional owner details
}

export default function CollectionCard({ collection, owner }: CollectionCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <NextLink href={`/collections/${collection.id}`} className="block">
          <Image
            src={collection.image || `https://placehold.co/600x400.png?text=${encodeURIComponent(collection.title)}`}
            alt={collection.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint="abstract geometric"
          />
        </NextLink>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {!collection.published && (
          <Badge variant="secondary" className="mb-2 inline-flex items-center">
            <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Private
          </Badge>
        )}
        <CardTitle className="text-xl mb-1 font-headline">
          <NextLink href={`/collections/${collection.id}`} className="hover:text-primary transition-colors">
            {collection.title}
          </NextLink>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 mb-2">
          {collection.description || 'No description available.'}
        </CardDescription>
        {owner && (
          <div className="text-xs text-muted-foreground flex items-center mt-2">
            <UserCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <NextLink href={`/profile/${owner.username}`} className="hover:text-primary transition-colors line-clamp-1">
              {owner.profile_name} (@{owner.username})
            </NextLink>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="outline" size="sm" className="w-full">
          <NextLink href={`/collections/${collection.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Collection
          </NextLink>
        </Button>
      </CardFooter>
    </Card>
  );
}
