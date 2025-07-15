import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types';
import { UserCircle } from 'lucide-react';

interface UserCardProps {
  user: UserProfile;
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4">
        <Link href={`/profile/${user.username}`} className="flex items-center space-x-4 group">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profile_picture} alt={user.profile_name} data-ai-hint="profile avatar" />
            <AvatarFallback>
              {user.profile_name ? user.profile_name.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-headline group-hover:text-primary transition-colors">
              {user.profile_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
