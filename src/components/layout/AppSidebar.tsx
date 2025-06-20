
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
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp, limit } from 'firebase/firestore';
import type { Collection as CollectionType, UserProfile } from '@/types';
import {
  Lightbulb,
  Search,
  PlusCircle,
  Library,
  PanelLeft,
  UserCircle,
  LogIn,
  // FolderOpen, // Not used
} from 'lucide-react';
import { cn } from '@/lib/utils';

const READING_LIST_TITLE = "Reading List";

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthStatus();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [readingListCollection, setReadingListCollection] = useState<CollectionType | null>(null);

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
      const fetchCollections = async () => {
        try {
          const qCollections = query(
            collection(db, 'collections'),
            where('owner', '==', user.uid),
            orderBy('title', 'asc')
          );
          const querySnapshot = await getDocs(qCollections);
          
          const fetchedCollections: CollectionType[] = [];
          let foundReadingList: CollectionType | null = null;

          querySnapshot.docs.forEach((doc) => {
            const colData = { id: doc.id, ...doc.data() } as CollectionType;
            if (colData.title === READING_LIST_TITLE) {
              foundReadingList = colData;
            } else {
              fetchedCollections.push(colData);
            }
          });

          setCollections(fetchedCollections);
          setReadingListCollection(foundReadingList);

        } catch (error) {
          console.error('Error fetching collections for sidebar:', error);
        } finally {
          setCollectionsLoading(false);
        }
      };
      fetchCollections();
    } else if (!user && !authLoading) {
      setCollections([]);
      setReadingListCollection(null);
      setCollectionsLoading(false);
    }
  }, [user, authLoading]);

  const isActive = (path: string) => pathname === path;
  const isCollectionsActive = () => pathname.startsWith('/collections/') || pathname === '/create-collection';

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="flex items-center justify-between p-2 group-data-[state=collapsed]:justify-center">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2" size="icon"> {/* Ensure button is sized for icon */}
            <PanelLeft className="h-6 w-6" />
          </SidebarTrigger>
          <span className="font-headline text-xl font-semibold group-data-[state=collapsed]:hidden">
            Woav
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/discover')}
              tooltip="Discover"
              size="lg"
            >
              <Link href="/discover">
                <Lightbulb className="h-6 w-6" />
                <span className="group-data-[state=collapsed]:hidden">Discover</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {user && !authLoading && (
            <>
              {readingListCollection && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(`/collections/${readingListCollection.id}`)}
                    tooltip="Reading List"
                    size="lg"
                  >
                    <Link href={`/collections/${readingListCollection.id}`}>
                      <Search className="h-6 w-6" />
                      <span className="group-data-[state=collapsed]:hidden">Reading List</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/add-link')}
                  tooltip="New"
                  size="lg"
                >
                  <Link href="/add-link">
                    <PlusCircle className="h-6 w-6" />
                    <span className="group-data-[state=collapsed]:hidden">New</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isCollectionsActive() && (!readingListCollection || pathname !== `/collections/${readingListCollection.id}`)}
                  tooltip="Collections"
                  size="lg"
                >
                  <Library className="h-6 w-6" />
                  <span className="group-data-[state=collapsed]:hidden">Collections</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                   <SidebarMenuSubItem>
                     <SidebarMenuSubButton asChild isActive={isActive('/create-collection')}>
                        <Link href="/create-collection">
                            {/* <PlusCircle className="h-3.5 w-3.5" />  Slightly smaller icon for sub-menu */}
                            <span className="group-data-[state=collapsed]:hidden">Create New Collection</span>
                        </Link>
                     </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {collectionsLoading ? (
                    <>
                      <SidebarMenuSkeleton showIcon={false} />
                      <SidebarMenuSkeleton showIcon={false} />
                    </>
                  ) : (
                    collections.map((col) => (
                      <SidebarMenuSubItem key={col.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(`/collections/${col.id}`)}
                        >
                          <Link href={`/collections/${col.id}`} className="flex justify-between items-center w-full">
                            <span className="truncate group-data-[state=collapsed]:hidden">{col.title}</span>
                            {!col.published && (
                              <Badge variant="secondary" className="ml-2 text-xs h-fit px-1.5 py-0.5 group-data-[state=collapsed]:hidden shrink-0">
                                private
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </>
          )}
          {!user && !authLoading && (
             <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={isActive('/auth/signin')}
                    tooltip="Sign In"
                    size="lg"
                    >
                    <Link href="/auth/signin">
                        <LogIn className="h-6 w-6" />
                        <span className="group-data-[state=collapsed]:hidden">Sign In</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      {user && userProfile && !authLoading && !profileLoading && (
         <SidebarFooter className="p-2 border-t border-sidebar-border">
            <Link 
              href={`/profile/${userProfile.username}`}
              className={cn(
                "flex items-center space-x-2 p-2 hover:bg-sidebar-accent rounded-md",
                "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:w-14 group-data-[state=collapsed]:h-14 group-data-[state=collapsed]:p-0"
              )}
              title={userProfile.profile_name}
            >
              <Avatar className="h-8 w-8 group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:w-10">
                <AvatarImage src={userProfile.profile_picture ?? undefined} alt={userProfile.profile_name} data-ai-hint="user avatar" />
                <AvatarFallback className="text-xs">
                  {userProfile.profile_name ? userProfile.profile_name.charAt(0).toUpperCase() : <UserCircle className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[state=collapsed]:hidden">
                <span className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.profile_name}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
              </div>
            </Link>
        </SidebarFooter>
      )}
       {(authLoading || (profileLoading && user)) && (
         <SidebarFooter className="p-2 border-t border-sidebar-border">
            <div className={cn(
                "flex items-center space-x-2 p-2",
                "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:w-14 group-data-[state=collapsed]:h-14 group-data-[state=collapsed]:p-0"
              )}>
              <Skeleton className="h-8 w-8 rounded-full group-data-[state=collapsed]:h-10 group-data-[state=collapsed]:w-10" />
              <div className="flex flex-col space-y-1 group-data-[state=collapsed]:hidden">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
        </SidebarFooter>
       )}
    </Sidebar>
  );
}
