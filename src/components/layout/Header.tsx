
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import UserNav from '@/components/layout/UserNav';
// Input and SearchIcon are removed as search is no longer in header
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { SearchIcon } from 'lucide-react';
import { PanelLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Search state can be removed if search input is fully removed from app or handled elsewhere
  // const [searchQuery, setSearchQuery] = useState('');

  // useEffect(() => {
  //   if (window.location.pathname === '/search' || window.location.pathname.startsWith('/search/')) {
  //      setSearchQuery(searchParams.get('q') || '');
  //   }
  // }, [searchParams]);


  // const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  //   } else {
  //     router.push('/search');
  //   }
  // };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center space-x-2">
          {/* Desktop Sidebar Trigger - REMOVED, as it's now internal to AppSidebar */}
          {/* <SidebarTrigger className="hidden md:flex" aria-label="Toggle desktop sidebar">
             <PanelLeft />
          </SidebarTrigger> */}
          {/* Mobile Sidebar Trigger - hidden on md and up, remains for mobile sheet */}
          <SidebarTrigger className="mr-2 md:hidden" aria-label="Toggle mobile sidebar">
             <PanelLeft />
          </SidebarTrigger>
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            // These classes might need adjustment based on how SidebarProvider/SidebarInset groups are structured
            // For an offcanvas sidebar on desktop, these might not be needed if the main content doesn't shift.
            // "group-data-[state=expanded]/sidebar-wrapper:md:pl-0", 
            // "group-data-[state=collapsed]/sidebar-wrapper:md:pl-0" 
          )}>
            <Logo /> {/* Logo is kept for brand visibility in the header */}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Search input form was here, now removed */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}

