import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInLoading() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Skeleton className="h-10 w-32 mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 p-6 pt-0">
          <Skeleton className="h-10 w-full max-w-xs" />
          <Skeleton className="h-4 w-full max-w-sm mt-2" />
          <Skeleton className="h-4 w-full max-w-xs mt-1" />
        </CardContent>
      </Card>
    </div>
  );
}
