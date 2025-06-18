
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import UserNav from '@/components/layout/UserNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, PanelLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Even if the input is removed, we might want to keep search state logic if it's used elsewhere or for future use.
  // For now, I'll keep setSearchQuery and searchQuery state variables.
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // If the page is /search, update the local searchQuery state from URL params
    if (window.location.pathname === '/search' || window.location.pathname.startsWith('/search/')) {
       setSearchQuery(searchParams.get('q') || '');
    }
    // Clear search query if navigating away from search page, unless you want it persistent
    // else {
    //   setSearchQuery('');
    // }
  }, [searchParams]);


  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center space-x-2">
          {/* Desktop Sidebar Trigger - visible on md and up */}
          <SidebarTrigger className="hidden md:flex" aria-label="Toggle desktop sidebar">
             <PanelLeft />
          </SidebarTrigger>
          {/* Mobile Sidebar Trigger - hidden on md and up */}
          <SidebarTrigger className="mr-2 md:hidden" aria-label="Toggle mobile sidebar">
             <PanelLeft />
          </SidebarTrigger>
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            "group-data-[state=expanded]/sidebar-wrapper:md:pl-0", // No extra padding when expanded
            "group-data-[state=collapsed]/sidebar-wrapper:md:pl-0" // No extra padding when collapsed (offcanvas)
          )}>
            <Logo />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Search input form removed */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
