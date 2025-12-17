import { Skeleton } from "@/components/ui/skeleton";

export default function SubjectsPaginationSkeleton() {
  return (
    <nav className="flex justify-center" aria-label="pagination">
      <ul className="flex flex-row items-center gap-1">
        {/* Previous button skeleton */}
        <li>
          <Skeleton className="h-10 w-24" />
        </li>
        {/* Page numbers skeleton */}
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-10 w-10" />
          </li>
        ))}
        {/* Next button skeleton */}
        <li>
          <Skeleton className="h-10 w-24" />
        </li>
      </ul>
    </nav>
  );
}
