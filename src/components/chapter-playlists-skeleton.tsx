import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterPlaylistsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Section Header Skeleton */}
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>

      {/* Chapters Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Chapter Number Badge Skeleton */}
                <Skeleton className="h-12 w-12 rounded-lg" />

                {/* Chapter Details Skeleton */}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {/* Title Skeleton */}
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />

                  {/* Description Skeleton */}
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>

                  {/* Canvas Count Skeleton */}
                  <div className="mt-auto">
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
