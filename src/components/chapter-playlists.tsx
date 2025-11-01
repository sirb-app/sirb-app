import ChapterPlaylistItem from "@/components/chapter-playlist-item";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Prisma } from "@/generated/prisma";
import { BookOpen } from "lucide-react";

type ChapterWithCanvases = Prisma.ChapterGetPayload<{
  include: {
    canvases: {
      where: { status: "APPROVED" };
      select: {
        id: true;
        title: true;
        description: true;
        sequence: true;
      };
    };
  };
}>;

type ChapterPlaylistsProps = {
  readonly chapters: ChapterWithCanvases[];
  readonly subjectId: number;
};

export default function ChapterPlaylists({
  chapters,
  subjectId,
}: ChapterPlaylistsProps) {
  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <Empty>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>لا توجد فصول بعد</EmptyTitle>
              <EmptyDescription>
                لم يتم إضافة أي فصول لهذا المقرر الدراسي حتى الآن.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Section Header */}
          <div className="mb-2">
            <h2 className="text-xl font-semibold">فصول المقرر</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              انقر على الفصل لعرض المحتويات، أو انقر على القائمة للاطلاع على
              المحتويات مباشرة
            </p>
          </div>

          {/* Chapters Accordion */}
          <div className="space-y-2 divide-y rounded-lg border">
            {chapters.map(chapter => (
              <ChapterPlaylistItem
                key={chapter.id}
                chapter={chapter}
                subjectId={subjectId}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
