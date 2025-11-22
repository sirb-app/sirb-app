import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { stripTitlePrefix } from "@/lib/utils";
import { BookOpen, ChevronRight, Users } from "lucide-react";
import Link from "next/link";

type Chapter = Prisma.ChapterGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    sequence: true;
    canvases: {
      select: {
        id: true;
        contributor: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

type ChapterInfoProps = {
  readonly chapter: Chapter;
  readonly subjectId: number;
};

export default function ChapterInfo({ chapter, subjectId }: ChapterInfoProps) {
  // Get unique contributors
  const contributors = new Set(chapter.canvases.map(c => c.contributor.id))
    .size;
  const canvasCount = chapter.canvases.length;

  return (
    <Card>
      <CardContent className="p-6 pt-4 md:p-8 md:pt-4">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href={`/subjects/${subjectId}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
            العودة إلى المقرر
          </Link>
        </div>

        {/* Chapter Title and Description */}
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl leading-tight font-bold md:text-4xl">
              {stripTitlePrefix(chapter.title)}
            </h1>
            <span className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              الفصل {chapter.sequence}
            </span>
          </div>
          {chapter.description && (
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
              {chapter.description}
            </p>
          )}
        </div>

        {/* Metadata - Horizontal on larger screens */}
        <div className="flex flex-wrap items-center gap-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <BookOpen className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-sm font-medium">عدد الدروس: {canvasCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-sm font-medium">
                عدد المساهمين: {contributors}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
