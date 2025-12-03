import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Skeleton className="h-7 w-48 sm:h-8 sm:w-64" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full sm:h-5 sm:max-w-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 sm:h-10 sm:w-24" />
                <Skeleton className="h-9 w-9 sm:h-10 sm:w-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-6 w-32 sm:h-7" />
              <Skeleton className="h-9 w-full sm:h-10 sm:w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Question List */}
            <div className="space-y-2 sm:space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* Question Number Badge */}
                      <Skeleton className="hidden h-12 w-12 shrink-0 rounded-full sm:block" />

                      {/* Question Content */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <Skeleton className="h-5 w-full sm:w-3/4" />
                          <Skeleton className="h-6 w-20 shrink-0" />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <Skeleton key={j} className="h-9 w-full sm:h-10" />
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 sm:flex-col">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Skeleton className="h-10 w-full sm:w-24" />
          <Skeleton className="h-10 w-full sm:w-32" />
        </div>
      </div>
    </div>
  );
}
