import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPageLoading() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-9 w-1/2" />
      
      <section>
        <Skeleton className="h-8 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={`col-${i}`} className="border rounded-lg shadow-md p-4 space-y-3">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-9 w-full mt-2" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={`user-${i}`} className="border rounded-lg shadow-md p-4 flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={`link-${i}`} className="border rounded-lg shadow-md p-4 space-y-2">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-6 w-6 rounded" />
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
