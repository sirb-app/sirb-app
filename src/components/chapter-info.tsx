import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { stripTitlePrefix } from "@/lib/utils";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";

type ChapterWithCanvases = Prisma.ChapterGetPayload<{
  include: {
    subject: {
      include: {
        college: {
          include: {
            university: true;
          };
        };
      };
    };
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
  readonly chapter: ChapterWithCanvases;
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
        <div className="space-y-6">
          {/* Chapter Title */}
          <div>
            <h1 className="text-2xl leading-tight font-bold md:text-3xl">
              {stripTitlePrefix(chapter.title)}
            </h1>
          </div>

          {/* Chapter Description */}
          {chapter.description && (
            <p className="text-muted-foreground leading-relaxed">
              {chapter.description}
            </p>
          )}

          {/* Chapter Metadata */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-muted-foreground h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">عدد المحتويات</p>
                <p className="text-muted-foreground text-sm">{canvasCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">عدد المساهمين</p>
                <p className="text-muted-foreground text-sm">{contributors}</p>
              </div>
            </div>
          </div>

          {/* Back to Subject */}
          <div className="border-t pt-6">
            <Link
              href={`/subjects/${subjectId}`}
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              ← العودة إلى المقرر
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
