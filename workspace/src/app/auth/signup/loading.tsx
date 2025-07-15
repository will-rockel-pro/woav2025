
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpLoading() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Skeleton className="h-10 w-32 mx-auto mb-4" /> {/* Logo Skeleton */}
          <Skeleton className="h-8 w-56 mx-auto" /> {/* Title Skeleton */}
          <Skeleton className="h-4 w-72 mx-auto mt-2" /> {/* Description Skeleton */}
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" /> {/* Label Skeleton */}
              <Skeleton className="h-10 w-full" /> {/* Input Skeleton */}
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" /> {/* Label Skeleton */}
              <Skeleton className="h-10 w-full" /> {/* Input Skeleton */}
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" /> {/* Label Skeleton */}
              <Skeleton className="h-10 w-full" /> {/* Input Skeleton */}
            </div>
            <Skeleton className="h-10 w-full" /> {/* Button Skeleton */}
          </div>
          <Skeleton className="h-4 w-48 mx-auto mt-2" /> {/* Sign In link skeleton */}
        </CardContent>
      </Card>
    </div>
  );
}
