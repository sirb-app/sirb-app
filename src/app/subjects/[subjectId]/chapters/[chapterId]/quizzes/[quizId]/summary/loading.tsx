import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Score Card */}
        <Card className="border-2">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 text-center">
              <Skeleton className="mx-auto h-8 w-48 sm:w-64" />
              <div className="rounded-lg p-4 sm:p-6">
                <Skeleton className="mx-auto mb-2 h-12 w-24 sm:h-16 sm:w-32" />
                <Skeleton className="mx-auto h-5 w-40 sm:h-6 sm:w-48" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Skeleton className="h-10 w-full sm:w-40" />
                <Skeleton className="h-10 w-full sm:w-40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Header */}
        <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />

        {/* Questions Review */}
        <div className="space-y-4 sm:space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Question Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-24 sm:w-32" />
                    <Skeleton className="h-5 w-full sm:h-6" />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full rounded-lg sm:h-12" />
                  ))}
                </div>

                {/* Justification */}
                <Skeleton className="h-16 w-full rounded-lg sm:h-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-center">
          <Skeleton className="h-10 w-full sm:h-12 sm:w-40" />
          <Skeleton className="h-10 w-full sm:h-12 sm:w-40" />
        </div>
      </div>
    </div>
  );
}
