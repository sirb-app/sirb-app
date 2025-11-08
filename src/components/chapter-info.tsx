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
      <CardContent className="p-6 md:p-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            href={`/subjects/${subjectId}`}
            className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
            العودة إلى المقرر
          </Link>
        </div>

        {/* Chapter Title and Description */}
        <div className="mb-6">
          <h1 className="text-3xl leading-tight font-bold md:text-4xl">
            {stripTitlePrefix(chapter.title)}
          </h1>
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
              <p className="text-sm font-medium">{canvasCount} محتوى</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-sm font-medium">{contributors} مساهم</p>
            </div>
          </div>

          <div className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            الفصل {chapter.sequence}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
