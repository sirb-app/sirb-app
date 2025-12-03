import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Question Navigation Carousel */}
        <div className="flex items-center justify-center">
          <div className="flex w-full max-w-3xl items-center justify-center gap-2 sm:gap-3">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="flex gap-1 overflow-hidden px-2 sm:gap-2 sm:px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 shrink-0 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-10 w-10 shrink-0" />
          </div>
        </div>

        {/* Question Card */}
        <Card>
          <CardContent className="space-y-6 p-4 sm:p-6">
            {/* Question Header */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full sm:w-3/4" />
            </div>

            {/* Options */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg sm:h-16" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Finish Button */}
        <div className="flex justify-center">
          <Skeleton className="h-12 w-full sm:w-auto sm:min-w-64" />
        </div>
      </div>
    </div>
  );
}
