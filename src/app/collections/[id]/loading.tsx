
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ImageOff, Link as LinkIconFeather } from 'lucide-react';

export default function CollectionDetailLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-6" /> {/* Back button skeleton */}
      </div>

      {/* Collection Header Skeleton */}
      <div className="border rounded-lg shadow-md overflow-hidden">
        <Skeleton className="w-full h-64 bg-muted flex items-center justify-center">
            <ImageOff className="w-16 h-16 text-gray-400" />
        </Skeleton>
        <div className="p-6 space-y-3">
          <Skeleton className="h-10 w-3/4" /> {/* Title */}
          <Skeleton className="h-4 w-1/4" /> {/* Owner info */}
          <Skeleton className="h-5 w-full" /> {/* Description line 1 */}
          <Skeleton className="h-5 w-2/3" /> {/* Description line 2 */}
        </div>
      </div>
      
      {/* Add Link Form Skeleton (conditionally rendered, so make it look like a card) */}
      <div className="border rounded-lg shadow-md">
        <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-1/3 mb-3" /> {/* Form Title */}
            <Skeleton className="h-10 w-full mb-2" /> {/* URL input */}
            <Skeleton className="h-10 w-full mb-2" /> {/* Title input */}
            <Skeleton className="h-20 w-full mb-3" /> {/* Description textarea */}
            <Skeleton className="h-10 w-1/3" /> {/* Submit button */}
        </div>
      </div>


      {/* Links Section Skeleton */}
      <section className="mt-10">
        <Skeleton className="h-9 w-1/2 mb-6" /> {/* Links title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg shadow-md p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-6 w-6 rounded mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
