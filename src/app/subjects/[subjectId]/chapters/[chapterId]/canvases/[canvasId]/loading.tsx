import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-8">
          {/* Back button */}
          <Skeleton className="h-10 w-32" />

          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>

          {/* Content blocks - generic and vague */}
          <div className="space-y-6">
            {/* Generic content block */}
            <Skeleton className="h-40 w-full rounded-lg" />

            {/* Generic content block */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* Generic content block */}
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
