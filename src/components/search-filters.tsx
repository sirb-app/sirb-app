"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Prisma } from "@/generated/prisma";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type University = Prisma.UniversityGetPayload<{
  select: { id: true; name: true; code: true };
}>;

type College = Prisma.CollegeGetPayload<{
  select: { id: true; name: true; universityId: true };
}>;

type SearchFiltersProps = {
  readonly universities: University[];
  readonly colleges: College[];
};

export default function SearchFilters({
  universities,
  colleges,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [universityId, setUniversityId] = useState(
    searchParams.get("university") || "all"
  );
  const [collegeId, setCollegeId] = useState(
    searchParams.get("college") || "all"
  );

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Filter colleges based on selected university
  const filteredColleges =
    universityId === "all"
      ? colleges
      : colleges.filter(c => c.universityId === Number(universityId));

  // Debounced URL update function
  const updateUrl = useCallback(
    (searchValue: string, uniId: string, collId: string) => {
      const params = new URLSearchParams();

      if (searchValue) params.set("search", searchValue);
      if (uniId !== "all") params.set("university", uniId);
      if (collId !== "all") params.set("college", collId);
      // Always reset to page 1 when filters change
      params.set("page", "1");

      const queryString = params.toString();
      const newUrl = queryString ? `/subjects?${queryString}` : "/subjects";

      router.push(newUrl, { scroll: false });
    },
    [router]
  );

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for search (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      updateUrl(search, universityId, collegeId);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, updateUrl, universityId, collegeId]);

  // Immediate update for university dropdown (with college reset logic)
  const handleUniversityChange = (value: string) => {
    setUniversityId(value);
    // Reset college if not in selected university
    if (value !== "all") {
      const collegesInUni = colleges.filter(
        c => c.universityId === Number(value)
      );
      const isCollegeInUni = collegesInUni.some(
        c => c.id === Number(collegeId)
      );
      if (!isCollegeInUni) {
        setCollegeId("all");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Search on top, filters below */}
      {/* Desktop: All in one row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input - grows to fill space on desktop */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="ابحث في المقررات (الاسم أو الكود)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 pr-10 pl-4"
          />
        </div>

        {/* Filters - side by side on mobile, compact on desktop */}
        <div className="flex min-w-0 gap-3">
          {/* University Filter */}
          <Select value={universityId} onValueChange={handleUniversityChange}>
            <SelectTrigger className="h-10 min-w-0 flex-1 md:w-[200px] md:flex-none">
              <SelectValue placeholder="الجامعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الجامعات</SelectItem>
              {universities.map(university => (
                <SelectItem
                  key={university.id}
                  value={university.id.toString()}
                >
                  جامعة {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* College Filter */}
          <Select
            value={collegeId}
            onValueChange={setCollegeId}
            disabled={universityId === "all"}
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 md:w-[200px] md:flex-none">
              <SelectValue placeholder="الكلية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الكليات</SelectItem>
              {filteredColleges.map(college => (
                <SelectItem key={college.id} value={college.id.toString()}>
                  كلية {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
