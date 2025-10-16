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
import { useEffect, useState, useTransition } from "react";

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
  const [isPending, startTransition] = useTransition();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [universityId, setUniversityId] = useState(
    searchParams.get("university") || "all"
  );
  const [collegeId, setCollegeId] = useState(
    searchParams.get("college") || "all"
  );

  // Filter colleges based on selected university
  const filteredColleges =
    universityId === "all"
      ? colleges
      : colleges.filter(c => c.universityId === Number(universityId));

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (universityId !== "all") params.set("university", universityId);
    if (collegeId !== "all") params.set("college", collegeId);
    // Always reset to page 1 when filters change
    params.set("page", "1");

    const queryString = params.toString();
    const newUrl = queryString ? `/subjects?${queryString}` : "/subjects";

    startTransition(() => {
      router.push(newUrl);
    });
  }, [search, universityId, collegeId, router]);

  // Reset college when university changes
  useEffect(() => {
    if (universityId !== "all") {
      const isCollegeInUniversity = filteredColleges.some(
        c => c.id === Number(collegeId)
      );
      if (!isCollegeInUniversity) {
        setCollegeId("all");
      }
    }
  }, [universityId, collegeId, filteredColleges]);

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
            disabled={isPending}
          />
        </div>

        {/* Filters - side by side on mobile, compact on desktop */}
        <div className="flex gap-3">
          {/* University Filter */}
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger className="h-10 w-full md:w-[180px]">
              <SelectValue placeholder="الجامعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الجامعات</SelectItem>
              {universities.map(university => (
                <SelectItem
                  key={university.id}
                  value={university.id.toString()}
                >
                  {university.name}
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
            <SelectTrigger className="h-10 w-full md:w-[180px]">
              <SelectValue placeholder="الكلية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الكليات</SelectItem>
              {filteredColleges.map(college => (
                <SelectItem key={college.id} value={college.id.toString()}>
                  {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
