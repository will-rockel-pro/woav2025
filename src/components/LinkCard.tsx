import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Link as LinkType } from '@/types';
import { ExternalLink, Link2 } from 'lucide-react';

interface LinkCardProps {
  link: LinkType;
}

export default function LinkCard({ link }: LinkCardProps) {
  const displayUrl = new URL(link.url).hostname;

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Image
            src={link.favicon || `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`}
            alt="Favicon"
            width={24}
            height={24}
            className="rounded mt-1"
            data-ai-hint="website favicon"
          />
          <div className="flex-1">
            <CardTitle className="text-lg mb-1 font-headline">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center group">
                {link.title || displayUrl}
                <ExternalLink className="ml-1.5 h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity" />
              </a>
            </CardTitle>
            <p className="text-xs text-muted-foreground break-all mb-1">{link.url}</p>
            {link.description && (
              <CardDescription className="text-sm line-clamp-2">
                {link.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
