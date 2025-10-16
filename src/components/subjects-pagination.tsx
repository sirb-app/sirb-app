"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";

type SubjectsPaginationProps = {
  readonly currentPage: number;
  readonly totalPages: number;
};

export default function SubjectsPagination({
  currentPage,
  totalPages,
}: SubjectsPaginationProps) {
  const searchParams = useSearchParams();

  // Helper to build URL with current filters and new page
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/subjects?${params.toString()}`;
  };

  // Don't show pagination if only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Show 2 pages on each side of current page
    const range: number[] = [];
    const rangeWithDots: (number | "ellipsis")[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "ellipsis");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("ellipsis", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous Button */}
        <PaginationItem>
          {currentPage > 1 ? (
            <PaginationPrevious href={buildPageUrl(currentPage - 1)} />
          ) : (
            <PaginationPrevious
              href="#"
              className="pointer-events-none opacity-50"
              aria-disabled="true"
            />
          )}
        </PaginationItem>

        {/* Page Numbers */}
        {pageNumbers.map((pageNum, idx) =>
          pageNum === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href={buildPageUrl(pageNum)}
                isActive={pageNum === currentPage}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* Next Button */}
        <PaginationItem>
          {currentPage < totalPages ? (
            <PaginationNext href={buildPageUrl(currentPage + 1)} />
          ) : (
            <PaginationNext
              href="#"
              className="pointer-events-none opacity-50"
              aria-disabled="true"
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
