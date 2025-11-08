import ChapterPlaylistsSkeleton from "@/components/chapter-playlists-skeleton";
import SubjectInfoSkeleton from "@/components/subject-info-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Subject Info Card */}
      <section className="mb-12" aria-label="معلومات المقرر">
        <SubjectInfoSkeleton />
      </section>

      {/* Chapter Playlists */}
      <section aria-label="فصول المقرر">
        <ChapterPlaylistsSkeleton />
      </section>
    </div>
  );
}
