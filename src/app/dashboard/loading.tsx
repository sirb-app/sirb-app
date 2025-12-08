import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Title */}
      <Skeleton className="mb-6 h-9 w-32 sm:h-10 sm:w-48" />

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-6">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 space-y-6">
        {/* Tabs List */}
        <div className="flex w-full items-center gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-8 flex-1 bg-background" />
          <Skeleton className="h-8 flex-1 bg-transparent" />
        </div>

        {/* Tab Content - Learning Tab (Default) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                {/* Subject Image */}
                <Skeleton className="aspect-video w-full rounded-t-xl" />

                {/* Card Content */}
                <div className="space-y-3 p-4">
                  {/* Subject Name & Code */}
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* College */}
                  <Skeleton className="h-4 w-32" />

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>

                  {/* Button */}
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
