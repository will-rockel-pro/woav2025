
import Link from 'next/link';
import { Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo() {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center text-primary hover:text-primary/80 transition-all duration-200 ease-in-out overflow-hidden",
        // Use group-data-state from the parent Sidebar component (which has 'group' class)
        "group-data-[state=expanded]:space-x-2",
        "group-data-[state=collapsed]:space-x-0 group-data-[state=collapsed]:w-7 group-data-[state=collapsed]:h-7 group-data-[state=collapsed]:justify-center"
      )}
      aria-label="Homepage"
    >
      <Archive className="h-7 w-7 flex-shrink-0" />
      <span
        className={cn(
          "font-headline text-2xl font-semibold whitespace-nowrap transition-all duration-200 ease-in-out",
          "group-data-[state=expanded]:opacity-100 group-data-[state=expanded]:max-w-[150px] group-data-[state=expanded]:ml-2",
          "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:max-w-0 group-data-[state=collapsed]:ml-0 group-data-[state=collapsed]:pointer-events-none"
        )}
        // aria-hidden is tricky with CSS-only hide/show for strict screen readers.
        // The opacity-0 and max-w-0 effectively hide it visually and from layout.
        // pointer-events-none ensures it's not interactive when collapsed.
      >
        WOAV Lite
      </span>
    </Link>
  );
}
