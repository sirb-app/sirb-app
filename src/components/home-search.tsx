"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Prisma } from "@/generated/prisma";
import { ArrowLeft, BookOpen, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type University = Prisma.UniversityGetPayload<{
  select: {
    id: true;
    name: true;
    code: true;
    imageUrl: true;
  };
}>;

type SearchResult = {
  id: number;
  name: string;
  code: string;
  college: {
    name: string;
    university: {
      name: string;
    };
  };
};

type HomeSearchProps = {
  readonly universities: University[];
};

export default function HomeSearch({ universities }: HomeSearchProps) {
  const router = useRouter();

  // Find IMAMU university as default, fallback to first university
  const defaultUniversity =
    universities.find(u => u.code === "IMAMU") || universities[0];

  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    defaultUniversity?.id.toString() || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const selectedUni = universities.find(
    u => u.id.toString() === selectedUniversity
  );

  // Debounced search - only fetches when user types
  const performSearch = useCallback(async (query: string, uniId: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        search: query,
        university: uniId,
        limit: "3",
      });

      const response = await fetch(`/api/subjects/search?${params}`);
      const data = await response.json();

      setSearchResults(data.subjects || []);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery, selectedUniversity);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, selectedUniversity, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(false); // Close dropdown before redirect

    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.set("search", searchQuery);
    }

    if (selectedUniversity) {
      params.set("university", selectedUniversity);
    }

    // Redirect to subjects page with search params
    router.push(`/subjects${params.toString() ? `?${params}` : ""}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="col-span-4 flex justify-center md:col-span-8 lg:col-span-12"
    >
      <div className="relative w-full max-w-2xl">
        <div className="flex w-full items-center gap-2 md:gap-3">
          {/* University Selector */}
          <Select
            value={selectedUniversity}
            onValueChange={setSelectedUniversity}
          >
            <SelectTrigger className="min-w-[90px] data-[size=default]:h-12 md:min-w-[100px] data-[size=default]:md:h-14">
              <div className="flex items-center justify-center">
                {selectedUni?.imageUrl ? (
                  <Image
                    src={selectedUni.imageUrl}
                    alt={`شعار ${selectedUni.name}`}
                    width={44}
                    height={44}
                    className="h-8 w-8 object-contain md:h-10 md:w-10"
                    priority
                  />
                ) : (
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full md:h-10 md:w-10">
                    <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {universities.map(university => (
                <SelectItem
                  key={university.id}
                  value={university.id.toString()}
                >
                  <div className="flex items-center gap-3">
                    {university.imageUrl ? (
                      <Image
                        src={university.imageUrl}
                        alt={`شعار ${university.name}`}
                        width={32}
                        height={32}
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                        <BookOpen className="h-3 w-3" />
                      </div>
                    )}
                    <span className="font-medium">جامعة {university.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 md:right-4 md:h-6 md:w-6" />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث في المقررات الدراسية..."
                className="h-12 pr-10 pl-4 text-base md:h-14 md:pr-14 md:text-lg"
                onFocus={() => searchQuery && setShowResults(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="hover:bg-muted absolute top-1/2 left-3 -translate-y-1/2 rounded-full p-1 transition-colors"
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Results Dropdown - Appears as you type */}
            {showResults && (
              <div className="bg-background absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border shadow-lg">
                {isSearching ? (
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-10 w-10 animate-pulse rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.map(subject => (
                      <Link
                        key={subject.id}
                        href={`/subjects/${subject.id}`}
                        onClick={() => {
                          setShowResults(false);
                        }}
                        className="hover:bg-muted/50 group flex items-start gap-3 border-b p-4 transition-colors last:border-b-0"
                      >
                        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                          <BookOpen className="text-primary h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="group-hover:text-primary line-clamp-1 font-semibold transition-colors">
                            {subject.name}
                          </h4>
                          <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                            {subject.college.name} •{" "}
                            {subject.college.university.name}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {subject.code}
                          </p>
                        </div>
                        <ArrowLeft className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
                      </Link>
                    ))}
                    <div className="bg-muted/30 border-t p-3 text-center">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        عرض جميع النتائج
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <BookOpen className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">
                      لم يتم العثور على نتائج
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      جرب البحث بكلمات مختلفة
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
