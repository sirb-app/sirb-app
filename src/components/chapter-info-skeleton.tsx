import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterInfoSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Title Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-3/4 md:h-12" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>
        </div>

        {/* Metadata Skeleton */}
        <div className="flex flex-wrap items-center gap-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>

          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
