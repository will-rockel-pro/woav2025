'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import UserNav from '@/components/layout/UserNav';
import { PanelLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center space-x-2">
          {/* Mobile Sidebar Trigger - hidden on md and up, remains for mobile sheet */}
          <SidebarTrigger className="mr-2 md:hidden" aria-label="Toggle mobile sidebar">
             <PanelLeft className="h-6 w-6" />
          </SidebarTrigger>
          <div className={cn(
            "transition-all duration-300 ease-in-out",
          )}>
            <Logo />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
