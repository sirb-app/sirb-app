import CanvasListSkeleton from "@/components/canvas-list-skeleton";
import ChapterInfoSkeleton from "@/components/chapter-info-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Chapter Info on Top */}
      <section className="mb-8" aria-label="معلومات الفصل">
        <ChapterInfoSkeleton />
      </section>

      {/* Canvas Grid Below */}
      <section aria-label="قائمة المحتويات">
        <CanvasListSkeleton />
      </section>
    </div>
  );
}
