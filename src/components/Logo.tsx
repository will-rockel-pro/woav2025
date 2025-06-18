
import Link from 'next/link';
import { Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo() {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center text-primary hover:text-primary/80 transition-all duration-200 ease-in-out overflow-hidden",
        // Default spacing for expanded state, adjust link size when collapsed
        "group-data-[state=expanded]/sidebar:space-x-2",
        "group-data-[state=collapsed]/sidebar:space-x-0 group-data-[state=collapsed]/sidebar:w-7 group-data-[state=collapsed]/sidebar:h-7 group-data-[state=collapsed]/sidebar:justify-center"
      )}
      aria-label="Homepage"
    >
      <Archive className="h-7 w-7 flex-shrink-0" />
      <span
        className={cn(
          "font-headline text-2xl font-semibold whitespace-nowrap transition-all duration-200 ease-in-out",
          // Use group-data-state from the Sidebar component (which should have 'group/sidebar' or just 'group')
          // The Sidebar component in ui/sidebar.tsx already has 'group' class, so this should work.
          "group-data-[state=expanded]:opacity-100 group-data-[state=expanded]:max-w-[150px] group-data-[state=expanded]:ml-2",
          "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:ml-0 group-data-[state=collapsed]:pointer-events-none"
        )}
        aria-hidden={true} // Dynamically set aria-hidden based on visibility in a useEffect if strict accessibility is needed for CSS-only hide/show
      >
        WOAV Lite
      </span>
    </Link>
  );
}
