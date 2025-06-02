'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import UserNav from '@/components/layout/UserNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Sync search input with URL query param 'q' if on search page
    if (router && (window.location.pathname === '/search' || window.location.pathname.startsWith('/search/'))) {
       setSearchQuery(searchParams.get('q') || '');
    }
  }, [searchParams, router]);


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
        <Logo />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md ml-auto">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search collections, links, users..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
