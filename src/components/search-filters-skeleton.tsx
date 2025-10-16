import { Skeleton } from "@/components/ui/skeleton";

export default function SearchFiltersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile: Search on top, filters below */}
      {/* Desktop: All in one row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input Skeleton - grows to fill space on desktop */}
        <Skeleton className="h-10 flex-1" />

        {/* Filters Skeleton - side by side */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-full md:w-[180px]" />
          <Skeleton className="h-10 w-full md:w-[180px]" />
        </div>
      </div>
    </div>
  );
}
