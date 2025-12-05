import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ModerationLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header: Title + Subject Selector */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-48 sm:h-10 sm:w-64" />
        <Skeleton className="h-10 w-full sm:w-[240px]" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        {/* Tabs List */}
        <div className="bg-muted flex w-full items-center gap-1 rounded-lg p-1">
          <Skeleton className="bg-background h-8 flex-1" />
          <Skeleton className="h-8 flex-1 bg-transparent" />
        </div>

        {/* Tab Content - Contributions Skeleton */}
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:p-6 md:flex-row md:items-center">
                {/* Left: Content Info */}
                <div className="flex-1 space-y-2 text-right">
                  {/* Badges Row */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {/* Title */}
                  <Skeleton className="h-6 w-full max-w-md" />
                  {/* Contributor */}
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Right: Action Buttons */}
                <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:justify-between md:w-auto md:flex-nowrap md:justify-end">
                  <Skeleton className="h-9 w-full rounded-md sm:w-auto sm:min-w-[100px]" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-auto sm:min-w-[80px]" />
                  <Skeleton className="h-9 w-full rounded-md sm:w-auto sm:min-w-[80px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
