import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Prisma } from "@/generated/prisma";
import { stripTitlePrefix } from "@/lib/utils";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";

type Chapter = Prisma.ChapterGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    sequence: true;
    _count: {
      select: {
        canvases: true;
      };
    };
  };
}>;

type ChapterPlaylistsProps = {
  readonly chapters: Chapter[];
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
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
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
    <div>
      {/* Chapters Grid - YouTube Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {chapters.map(chapter => (
          <Link
            key={chapter.id}
            href={`/subjects/${subjectId}/chapters/${chapter.id}`}
            className="group"
          >
            <Card className="hover:border-primary/50 h-full gap-0 p-0 transition-all hover:shadow-md">
              <CardContent className="flex h-full flex-col p-0">
                {/* Thumbnail Area */}
                <div className="from-primary/10 to-primary/5 relative aspect-video w-full overflow-hidden rounded-t-xl bg-gradient-to-br">
                  {/* Chapter Number Badge - Outlined Style */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-primary/30 group-hover:border-primary/50 group-hover:bg-primary/5 flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all">
                      <span className="text-primary text-4xl font-bold">
                        {chapter.sequence}
                      </span>
                    </div>
                  </div>

                  {/* Content Count Badge - Accent Color */}
                  <div className="bg-accent text-accent-foreground absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold shadow-lg">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{chapter._count.canvases}</span>
                  </div>
                </div>

                {/* Chapter Info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="group-hover:text-primary line-clamp-2 leading-tight font-semibold transition-colors">
                    {stripTitlePrefix(chapter.title)}
                  </h3>
                  {chapter.description && (
                    <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm leading-relaxed">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
