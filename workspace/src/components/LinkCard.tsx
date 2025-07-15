
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import type { Link as LinkType } from '@/types';
import { ExternalLink, Link2 } from 'lucide-react';
import { useState } from 'react';

interface LinkCardProps {
  link: LinkType;
}

export default function LinkCard({ link }: LinkCardProps) {
  const [faviconError, setFaviconError] = useState(false);

  let currentSiteHostname: string | undefined;
  if (typeof window !== 'undefined') {
    currentSiteHostname = window.location.hostname;
  }

  let isCurrentSiteLink = false;
  let linkHostnameForComparison: string | undefined;
  try {
    // Use new URL(link.url).hostname for comparison, as it's more robust.
    linkHostnameForComparison = new URL(link.url).hostname;
    if (currentSiteHostname && linkHostnameForComparison === currentSiteHostname) {
      isCurrentSiteLink = true;
    }
  } catch (e) {
    // If URL parsing fails, treat as not a current site link
    // console.warn("Could not parse link URL for hostname check:", link.url, e);
  }

  // Determine the source for the favicon
  const actualFaviconSrc = isCurrentSiteLink
    ? '/favicon.ico' // Use local favicon for the current site
    : link.favicon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}`;

  // For display purposes, try to get the hostname, fallback to full URL
  let displayUrlToShow = link.url;
  try {
    displayUrlToShow = new URL(link.url).hostname;
  } catch (e) { /* Use full link.url if hostname parsing fails */ }

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {faviconError ? (
            <Link2 className="w-6 h-6 text-muted-foreground rounded mt-1 flex-shrink-0" />
          ) : (
            <Image
              src={actualFaviconSrc}
              alt="Favicon"
              width={24}
              height={24}
              className="rounded mt-1 flex-shrink-0"
              data-ai-hint="website favicon"
              onError={() => {
                setFaviconError(true);
              }}
              // Unoptimize external favicons to prevent issues if not whitelisted
              // and to avoid Next.js optimization attempts on third-party assets.
              // Local /favicon.ico will still be optimized by Next.js.
              unoptimized={actualFaviconSrc.startsWith('http')}
            />
          )}
          <div className="flex-1 min-w-0"> {/* min-w-0 helps with flex truncation */}
            <CardTitle className="text-lg mb-1 font-headline">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center group break-all" /* break-all for long titles */
              >
                {link.title || displayUrlToShow} {/* Use derived displayUrlToShow */}
                <ExternalLink className="ml-1.5 h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0" />
              </a>
            </CardTitle>
            <p className="text-xs text-muted-foreground break-all mb-1">{link.url}</p>
            {link.description && (
              <CardDescription className="text-sm line-clamp-2 break-words"> {/* break-words for descriptions */}
                {link.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
