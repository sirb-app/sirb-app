import CanvasListSkeleton from "@/components/canvas-list-skeleton";
import ChapterInfoSkeleton from "@/components/chapter-info-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Chapter Info on Top */}
      <section className="mb-8" aria-label="معلومات الفصل">
        <ChapterInfoSkeleton />
      </section>

      {/* Tabs */}
      <div className="mt-8 space-y-6">
        {/* Tabs List */}
        <div className="flex w-full items-center gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-8 flex-1 bg-background" />
          <Skeleton className="h-8 flex-1 bg-transparent" />
        </div>

        {/* Tab Content */}
        <section aria-label="قائمة المحتويات">
          <CanvasListSkeleton />
        </section>
      </div>
    </div>
  );
}
