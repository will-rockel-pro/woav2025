
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
  SidebarTrigger,
  SidebarMenuSkeleton // Added missing import
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
  PlusCircle,
  Link as LinkIcon,
  User as UserIcon,
  FolderOpen,
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  FilePlus
} from 'lucide-react';
import SignOutButton from '../auth/SignOutButton'; 

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
        orderBy('title', 'asc') // Order by title for easier scanning
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
      // For realtime updates, use onSnapshot and return the unsubscribe function
      // For now, getDocs is fine for simplicity
    } else if (!user && !authLoading) {
      setCollections([]);
      setCollectionsLoading(false);
    }
  }, [user, authLoading]);

  const isActive = (path: string) => pathname === path;
  const isCollectionsActive = () => pathname.startsWith('/collections/') || pathname === '/create-collection';


  return (
    <Sidebar collapsible="icon" className="hidden md:flex"> {/* Hidden on mobile, main trigger in Header.tsx handles mobile */}
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
            <Logo />
            <SidebarTrigger className="ml-auto data-[state=collapsed]:ml-0" /> {/* Desktop trigger */}
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
                  className="group-data-[collapsible=icon]:aria-[current=page]:bg-sidebar-accent"
                  suffix={
                     <ChevronDown className="group-data-[state=open]:hidden group-data-[collapsible=icon]:hidden" />
                  }
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
                  {/* {collections.length === 0 && !collectionsLoading && (
                     <SidebarMenuSubItem>
                        <span className="px-2 py-1.5 text-xs text-muted-foreground">No collections yet.</span>
                    </SidebarMenuSubItem>
                  )} */}
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
            {/* Example: Sign Out Button in Footer */}
            {/* <SignOutButton /> */}
            {/* Or a settings link */}
            {/* <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/settings')} tooltip="Settings">
                        <Link href="/settings">
                        <Settings />
                        <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu> */}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
