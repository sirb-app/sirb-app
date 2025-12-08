"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import AddCanvasButton from "./add-canvas-button";
import AddQuizButton from "./add-quiz-button";
import CanvasList from "./canvas-list";
import QuizList from "./quiz-list";

type Canvas = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sequence: number;
  netScore: number;
  createdAt: Date;
  contributor: {
    id: string;
    name: string | null;
  };
  userProgress: { completedAt: Date | null }[] | false;
};

type Quiz = {
  id: number;
  title: string;
  description: string | null;
  sequence: number;
  netScore: number;
  attemptCount: number;
  createdAt: Date;
  contributor: {
    id: string;
    name: string | null;
  };
  questions: { id: number }[];
  attempts:
    | {
        score: number;
        totalQuestions: number;
        completedAt: Date | null;
        [key: string]: unknown;
      }[]
    | false;
};

type ChapterContentTabsProps = {
  canvases: Canvas[];
  quizzes: Quiz[];
  chapterId: number;
  subjectId: number;
  isAuthenticated: boolean;
};

type SortOption = "sequence" | "popular";

export default function ChapterContentTabs({
  canvases,
  quizzes,
  chapterId,
  subjectId,
  isAuthenticated,
}: ChapterContentTabsProps) {
  const [canvasSortBy, setCanvasSortBy] = useState<SortOption>("sequence");
  const [quizSortBy, setQuizSortBy] = useState<SortOption>("sequence");

  const sortedCanvases = useMemo(() => {
    const sorted = [...canvases];
    if (canvasSortBy === "popular") {
      return sorted.sort((a, b) => b.netScore - a.netScore);
    }
    return sorted.sort((a, b) => a.sequence - b.sequence);
  }, [canvases, canvasSortBy]);

  const sortedQuizzes = useMemo(() => {
    const sorted = [...quizzes];
    if (quizSortBy === "popular") {
      return sorted.sort((a, b) => b.netScore - a.netScore);
    }
    return sorted.sort((a, b) => a.sequence - b.sequence);
  }, [quizzes, quizSortBy]);

  return (
    <Tabs defaultValue="canvases" className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-2 border-b">
        <TabsTrigger value="canvases">الشروحات ({canvases.length})</TabsTrigger>
        <TabsTrigger value="quizzes">الاختبارات ({quizzes.length})</TabsTrigger>
      </TabsList>

      {/* Canvases Tab */}
      <TabsContent value="canvases" className="mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">الشروحات</h2>
            <Select
              value={canvasSortBy}
              onValueChange={(value: SortOption) => setCanvasSortBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequence">الترتيب الأصلي</SelectItem>
                <SelectItem value="popular">الأكثر شعبية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isAuthenticated && canvases.length > 0 && (
            <AddCanvasButton chapterId={chapterId} hasCanvases={true} />
          )}
        </div>

        {sortedCanvases.length > 0 ? (
          <CanvasList
            canvases={sortedCanvases}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
          />
        ) : isAuthenticated ? (
          <AddCanvasButton chapterId={chapterId} hasCanvases={false} />
        ) : (
          <CanvasList
            canvases={[]}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
          />
        )}
      </TabsContent>

      {/* Quizzes Tab */}
      <TabsContent value="quizzes" className="mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">الاختبارات</h2>
            <Select
              value={quizSortBy}
              onValueChange={(value: SortOption) => setQuizSortBy(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequence">الترتيب الأصلي</SelectItem>
                <SelectItem value="popular">الأكثر شعبية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isAuthenticated && quizzes.length > 0 && (
            <AddQuizButton chapterId={chapterId} hasQuizzes={true} />
          )}
        </div>

        {sortedQuizzes.length > 0 ? (
          <QuizList
            quizzes={sortedQuizzes}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
          />
        ) : isAuthenticated ? (
          <AddQuizButton chapterId={chapterId} hasQuizzes={false} />
        ) : (
          <QuizList
            quizzes={[]}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
