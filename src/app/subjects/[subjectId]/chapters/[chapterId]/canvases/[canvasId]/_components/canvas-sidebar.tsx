"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Prisma } from "@/generated/prisma";
import { stripTitlePrefix } from "@/lib/utils";
import { Check, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type SubjectWithChapters = Prisma.SubjectGetPayload<{
  include: {
    chapters: {
      include: {
        canvases: {
          select: {
            id: true;
            title: true;
            sequence: true;
          };
        };
      };
    };
  };
}>;

type CanvasSidebarProps = {
  readonly subject: SubjectWithChapters;
  readonly currentChapterId: number;
  readonly currentCanvasId: number;
};

export default function CanvasSidebar({
  subject,
  currentChapterId,
  currentCanvasId,
}: CanvasSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4">
        <h2 className="leading-tight font-semibold">{subject.name}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{subject.code}</p>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto">
        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={[`chapter-${currentChapterId}`]}
        >
          {subject.chapters.map(chapter => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              currentCanvasId={currentCanvasId}
              subjectId={subject.id}
              onCanvasClick={() => setMobileOpen(false)}
            />
          ))}
        </Accordion>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-background hidden w-72 shrink-0 border-r lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">فتح القائمة</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

type ChapterItemProps = {
  readonly chapter: SubjectWithChapters["chapters"][number];
  readonly currentCanvasId: number;
  readonly subjectId: number;
  readonly onCanvasClick: () => void;
};

function ChapterItem({
  chapter,
  currentCanvasId,
  subjectId,
  onCanvasClick,
}: ChapterItemProps) {
  return (
    <AccordionItem
      value={`chapter-${chapter.id}`}
      className="border-b last:border-b-0"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center text-xs font-medium">
            {chapter.sequence}
          </span>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm leading-tight font-medium">
              {stripTitlePrefix(chapter.title)}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-0 pb-2">
        <div className="space-y-0.5 px-4">
          {chapter.canvases.map(canvas => {
            const isCurrentCanvas = canvas.id === currentCanvasId;
            return (
              <Link
                key={canvas.id}
                href={`/subjects/${subjectId}/chapters/${chapter.id}/canvases/${canvas.id}`}
                onClick={onCanvasClick}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isCurrentCanvas
                    ? "bg-primary/15 border-primary/30 text-primary border font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex-1 text-right leading-tight">
                  {stripTitlePrefix(canvas.title)}
                </span>
                {isCurrentCanvas && <Check className="h-4 w-4 shrink-0" />}
              </Link>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
