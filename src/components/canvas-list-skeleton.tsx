import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CanvasListSkeleton() {
  return (
    <div>
      {/* Section Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-32" />
      </div>

      {/* Canvas Grid Skeleton - YouTube Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="gap-0 p-0 transition-all">
            <CardContent className="flex h-full flex-col p-0">
              {/* Thumbnail Skeleton */}
              <Skeleton className="aspect-video w-full rounded-t-xl" />

              {/* Info Skeleton */}
              <div className="space-y-2 p-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
