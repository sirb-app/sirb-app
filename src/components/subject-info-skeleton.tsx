import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectInfoSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row-reverse md:items-start md:gap-8">
          {/* Image Skeleton - Shows first on mobile, Left on desktop */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg md:w-80 md:flex-shrink-0">
            <Skeleton className="h-full w-full" />
            {/* Code Badge Skeleton */}
            <Skeleton className="absolute top-3 left-3 h-6 w-16 rounded-md" />
          </div>

          {/* Content Skeleton */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Title Skeleton */}
            <Skeleton className="h-8 w-3/4 md:h-10" />

            {/* Description Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* College/University Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="mt-auto">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
