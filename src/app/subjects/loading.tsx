import SearchFiltersSkeleton from "@/components/search-filters-skeleton";
import SubjectListSkeleton from "@/components/subject-list-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-6xl px-3 py-8 md:px-8 lg:px-16">
      {/* Search and Filters */}
      <section className="mb-8" aria-label="بحث وتصفية المقررات">
        <SearchFiltersSkeleton />
      </section>

      {/* Subject List */}
      <section className="mb-12" aria-label="قائمة المقررات الدراسية">
        <SubjectListSkeleton />
      </section>
    </div>
  );
}

