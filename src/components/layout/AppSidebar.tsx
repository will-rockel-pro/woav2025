
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSkeleton,
  SidebarTrigger, // Re-added
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/Logo';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Collection, UserProfile } from '@/types';
import {
  LayoutDashboard,
  Library,
  Link as LinkIcon,
  User as UserIcon,
  FolderOpen,
  LogOut,
  FilePlus,
  PanelLeft, // Re-added
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthStatus();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      const fetchUserProfile = async () => {
        setProfileLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile(userDocSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile for sidebar:', error);
        } finally {
          setProfileLoading(false);
        }
      };
      fetchUserProfile();
    } else if (!user && !authLoading) {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && !authLoading) {
      setCollectionsLoading(true);
      const q = query(
        collection(db, 'collections'),
        where('owner', '==', user.uid),
        orderBy('title', 'asc')
      );
      const unsubscribe = getDocs(q)
        .then((querySnapshot) => {
          const fetchedCollections = querySnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Collection)
          );
          setCollections(fetchedCollections);
        })
        .catch((error) => {
          console.error('Error fetching collections for sidebar:', error);
        })
        .finally(() => {
          setCollectionsLoading(false);
        });
    } else if (!user && !authLoading) {
      setCollections([]);
      setCollectionsLoading(false);
    }
  }, [user, authLoading]);

  const isActive = (path: string) => pathname === path;
  const isCollectionsActive = () => pathname.startsWith('/collections/') || pathname === '/create-collection';


  return (
    <Sidebar collapsible="icon" className="hidden md:flex group">
      <SidebarHeader>
        <div className={cn(
          "flex items-center w-full", // Removed fixed h-10, SidebarHeader has p-2 by default
          "group-data-[state=collapsed]:justify-center",
          "group-data-[state=expanded]:justify-between"
        )}>
          <Logo />
          <SidebarTrigger>
            <PanelLeft />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/discover')}
              tooltip="Discover"
            >
              <Link href="/discover">
                <LayoutDashboard />
                <span>Discover</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && !authLoading && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCollectionsActive()}
                  tooltip="My Collections"
                >
                  <Library />
                  <span>My Collections</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                     <SidebarMenuSubButton asChild isActive={isActive('/create-collection')}>
                        <Link href="/create-collection">
                            <FilePlus />
                            <span>Create New</span>
                        </Link>
                     </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {collectionsLoading ? (
                    <>
                      <SidebarMenuSkeleton showIcon />
                      <SidebarMenuSkeleton showIcon />
                    </>
                  ) : (
                    collections.map((col) => (
                      <SidebarMenuSubItem key={col.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(`/collections/${col.id}`)}
                        >
                          <Link href={`/collections/${col.id}`}>
                            <FolderOpen />
                            <span>{col.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/add-link')}
                  tooltip="Add New Link"
                >
                  <Link href="/add-link">
                    <LinkIcon />
                    <span>Add New Link</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  disabled={profileLoading || !userProfile}
                  isActive={userProfile ? isActive(`/profile/${userProfile.username}`) : false}
                  tooltip="My Profile"
                >
                  <Link href={userProfile ? `/profile/${userProfile.username}` : '#'}>
                    <UserIcon />
                    <span>My Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          {!user && !authLoading && (
             <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={isActive('/auth/signin')}
                    tooltip="Sign In"
                    >
                    <Link href="/auth/signin">
                        <LogOut />
                        <span>Sign In</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      {user && !authLoading && (
         <SidebarFooter className="p-2">
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
