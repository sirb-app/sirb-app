import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function SubjectCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      {/* Image skeleton */}
      <Skeleton className="aspect-video w-full" />

      {/* Content */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Subject name skeleton */}
        <Skeleton className="h-5 w-3/4" />

        {/* Description skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* College and University skeletons */}
        <div className="mt-auto space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </CardContent>

      {/* Footer with Button skeleton */}
      <CardFooter className="px-4 pt-0 pb-4">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function SubjectListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SubjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
