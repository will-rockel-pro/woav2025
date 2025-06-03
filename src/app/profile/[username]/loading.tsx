
import { Skeleton } from "@/components/ui/skeleton";
import { Library, UserCircle } from 'lucide-react';

export default function UserProfileLoading() {
  return (
    <div className="space-y-10">
      {/* Profile Header Skeleton */}
      <div className="border rounded-lg shadow-md p-6 sm:p-8 flex flex-col items-center text-center">
        <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full mb-4" />
        <Skeleton className="h-10 w-3/4 max-w-xs mb-2" /> {/* Profile Name */}
        <Skeleton className="h-6 w-1/2 max-w-xxs" /> {/* Username */}
      </div>

      {/* Collections Section Skeleton */}
      <section>
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-8 mr-3 rounded" /> {/* Icon */}
          <Skeleton className="h-9 w-1/2 md:w-1/3" /> {/* Title */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg shadow-md p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-md" /> {/* Image */}
              <Skeleton className="h-4 w-20 mb-2" /> {/* Badge (private) */}
              <Skeleton className="h-6 w-3/4" /> {/* Title */}
              <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
              <Skeleton className="h-4 w-2/3" /> {/* Description line 2 */}
              <Skeleton className="h-5 w-1/2 mt-1" /> {/* Owner info */}
              <Skeleton className="h-9 w-full mt-2" /> {/* Button */}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
