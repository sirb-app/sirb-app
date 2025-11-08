"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Prisma } from "@/generated/prisma";
import { cn, stripTitlePrefix } from "@/lib/utils";
import { BookOpen, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type CanvasWithContributor = Prisma.CanvasGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    imageUrl: true;
    sequence: true;
    createdAt: true;
    contributor: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

type CanvasListProps = {
  readonly canvases: CanvasWithContributor[];
  readonly chapterId: number;
  readonly subjectId: number;
  readonly isAuthenticated: boolean;
};

export default function CanvasList({
  canvases,
  chapterId,
  subjectId,
  isAuthenticated,
}: CanvasListProps) {
  const router = useRouter();

  const handleCanvasClick = (e: React.MouseEvent, canvasId: number) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.info("يجب تسجيل الدخول لعرض المحتوى", {
        description: "سجل دخولك للوصول إلى المحتويات التعليمية",
        action: {
          label: "تسجيل الدخول",
          onClick: () => router.push("/auth/login"),
        },
      });
    }
  };

  if (canvases.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>لا توجد محتويات بعد</EmptyTitle>
                <EmptyDescription>
                  لم يتم إضافة أي محتويات تعليمية لهذا الفصل حتى الآن
                </EmptyDescription>
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">المحتويات التعليمية</h2>
      </div>

      {/* Canvas Grid - YouTube Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {canvases.map(canvas => (
          <CanvasCard
            key={canvas.id}
            canvas={canvas}
            chapterId={chapterId}
            subjectId={subjectId}
            isAuthenticated={isAuthenticated}
            onCanvasClick={handleCanvasClick}
          />
        ))}
      </div>
    </div>
  );
}

type CanvasCardProps = {
  readonly canvas: CanvasWithContributor;
  readonly chapterId: number;
  readonly subjectId: number;
  readonly isAuthenticated: boolean;
  readonly onCanvasClick: (e: React.MouseEvent, canvasId: number) => void;
};

function CanvasCard({
  canvas,
  chapterId,
  subjectId,
  isAuthenticated,
  onCanvasClick,
}: CanvasCardProps) {
  return (
    <Link
      href={`/subjects/${subjectId}/chapters/${chapterId}/canvases/${canvas.id}`}
      onClick={e => !isAuthenticated && onCanvasClick(e, canvas.id)}
      className={cn("group", !isAuthenticated && "pointer-events-none")}
    >
      <Card
        className={cn(
          "hover:border-primary/50 h-full gap-0 p-0 transition-all hover:shadow-md",
          !isAuthenticated && "opacity-75"
        )}
      >
        <CardContent className="flex h-full flex-col p-0">
          {/* Thumbnail Area */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            {canvas.imageUrl ? (
              <Image
                src={canvas.imageUrl}
                alt={canvas.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="from-muted to-muted/50 flex h-full w-full items-center justify-center bg-gradient-to-br">
                {isAuthenticated ? (
                  <BookOpen className="text-muted-foreground/20 h-16 w-16" />
                ) : (
                  <Lock className="text-muted-foreground/20 h-16 w-16" />
                )}
              </div>
            )}

            {/* Locked Overlay */}
            {!isAuthenticated && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="bg-background/90 flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">مقفل</span>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Info */}
          <div className="flex flex-1 flex-col p-3">
            <h3
              className={cn(
                "line-clamp-2 leading-tight font-semibold transition-colors",
                isAuthenticated && "group-hover:text-primary"
              )}
            >
              {stripTitlePrefix(canvas.title)}
            </h3>

            {canvas.description && (
              <p className="text-muted-foreground mt-2 line-clamp-3 flex-1 text-sm leading-relaxed">
                {canvas.description}
              </p>
            )}

            <div className="text-muted-foreground mt-3 text-xs">
              <span>بواسطة {canvas.contributor.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
