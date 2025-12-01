"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentStatus } from "@/generated/prisma";
import { FileX } from "lucide-react";
import { useMemo, useState } from "react";
import CanvasContributionCard from "./canvas-contribution-card";

const statusLabels = {
  DRAFT: "مسودات",
  PENDING: "قيد المراجعة",
  REJECTED: "مرفوضة",
  APPROVED: "منشورة",
} as const;

const emptyMessages = {
  DRAFT: "لا توجد مسودات حالياً",
  PENDING: "لا توجد مساهمات قيد المراجعة",
  REJECTED: "لا توجد مساهمات مرفوضة",
  APPROVED: "لا توجد مساهمات منشورة",
} as const;

type Canvas = {
  id: number;
  title: string;
  status: ContentStatus;
  rejectionReason: string | null;
  updatedAt: Date;
  chapter: {
    id: number;
    title: string;
    subject: {
      id: number;
      name: string;
      code: string;
    };
  };
  _count: {
    contentBlocks: number;
  };
};

type ContributionsTabProps = {
  readonly canvasesByStatus: {
    DRAFT: Canvas[];
    PENDING: Canvas[];
    REJECTED: Canvas[];
    APPROVED: Canvas[];
  };
};

export default function ContributionsTab({
  canvasesByStatus,
}: ContributionsTabProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");

  const subjects = useMemo(() => {
    const allCanvases = Object.values(canvasesByStatus).flat();
    const uniqueSubjects = new Map();

    allCanvases.forEach(canvas => {
      const subjectId = canvas.chapter.subject.id;
      if (!uniqueSubjects.has(subjectId)) {
        uniqueSubjects.set(subjectId, {
          id: subjectId,
          name: canvas.chapter.subject.name,
          code: canvas.chapter.subject.code,
        });
      }
    });

    return Array.from(uniqueSubjects.values());
  }, [canvasesByStatus]);

  const chapters = useMemo(() => {
    if (selectedSubjectId === "all") return [];

    const allCanvases = Object.values(canvasesByStatus).flat();
    const uniqueChapters = new Map();

    allCanvases.forEach(canvas => {
      if (canvas.chapter.subject.id.toString() === selectedSubjectId) {
        const chapterId = canvas.chapter.id;
        if (!uniqueChapters.has(chapterId)) {
          uniqueChapters.set(chapterId, {
            id: chapterId,
            title: canvas.chapter.title,
          });
        }
      }
    });

    return Array.from(uniqueChapters.values());
  }, [canvasesByStatus, selectedSubjectId]);

  const filteredCanvasesByStatus = useMemo(() => {
    const filtered: typeof canvasesByStatus = {
      DRAFT: [],
      PENDING: [],
      REJECTED: [],
      APPROVED: [],
    };

    Object.entries(canvasesByStatus).forEach(([status, canvases]) => {
      filtered[status as keyof typeof filtered] = canvases.filter(canvas => {
        const matchesSubject =
          selectedSubjectId === "all" ||
          canvas.chapter.subject.id.toString() === selectedSubjectId;

        const matchesChapter =
          selectedChapterId === "all" ||
          canvas.chapter.id.toString() === selectedChapterId;

        return matchesSubject && matchesChapter;
      });
    });

    return filtered;
  }, [canvasesByStatus, selectedSubjectId, selectedChapterId]);

  const hasAnyContributions = Object.values(canvasesByStatus).some(
    arr => arr.length > 0
  );

  const hasFilteredContributions = Object.values(
    filteredCanvasesByStatus
  ).some(arr => arr.length > 0);

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
    setSelectedChapterId("all");
  };

  if (!hasAnyContributions) {
    return (
      <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
        <FileX className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p className="text-lg font-medium">لا توجد مساهمات حتى الآن</p>
        <p className="text-sm">ابدأ بالمساهمة في المحتوى التعليمي</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-3">
          {/* Subject Filter */}
          <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="جميع المقررات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-right">
                جميع المقررات
              </SelectItem>
              {subjects.map(subject => (
                <SelectItem
                  key={subject.id}
                  value={subject.id.toString()}
                  className="text-right"
                >
                  <span className="text-muted-foreground ml-2 font-mono text-xs">
                    {subject.code}
                  </span>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chapter Filter - Only shown when subject is selected */}
          {selectedSubjectId !== "all" && chapters.length > 0 && (
            <Select
              value={selectedChapterId}
              onValueChange={setSelectedChapterId}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="جميع الفصول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-right">
                  جميع الفصول
                </SelectItem>
                {chapters.map(chapter => (
                  <SelectItem
                    key={chapter.id}
                    value={chapter.id.toString()}
                    className="text-right"
                  >
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Canvases by Status */}
      {!hasFilteredContributions ? (
        <div className="text-muted-foreground bg-muted/20 rounded-lg border py-12 text-center">
          <FileX className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg font-medium">لا توجد نتائج</p>
          <p className="text-sm">لا توجد مساهمات تطابق الفلاتر المحددة</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(["DRAFT", "PENDING", "REJECTED", "APPROVED"] as const).map(
            status => {
              const canvases = filteredCanvasesByStatus[status];

              return (
                <div key={status} className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {statusLabels[status]} ({canvases.length})
                  </h3>

                  {canvases.length === 0 ? (
                    <div className="text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed py-8 text-center text-sm">
                      {emptyMessages[status]}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {canvases.map(canvas => (
                        <CanvasContributionCard
                          key={canvas.id}
                          canvas={canvas}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
