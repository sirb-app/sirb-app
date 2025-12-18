"use client";

import { toggleCanvasCompletion } from "@/actions/canvas-progress.action";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn, stripTitlePrefix } from "@/lib/utils";
import { BookOpen, Check, Lock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type CanvasWithContributor = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sequence: number;
  createdAt: Date;
  contributor: {
    id: string;
    name: string | null;
  };
  userProgress: { completedAt: Date | null }[] | false;
};

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

  const handleCanvasClick = (e: React.MouseEvent) => {
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
  readonly onCanvasClick: (e: React.MouseEvent) => void;
};

function CanvasCard({
  canvas,
  chapterId,
  subjectId,
  isAuthenticated,
  onCanvasClick,
}: CanvasCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Determine if canvas is completed
  // Using !! to convert to boolean - handles both null and undefined correctly
  const isCompleted =
    isAuthenticated &&
    canvas.userProgress !== false &&
    !!canvas.userProgress?.[0]?.completedAt;

  // Optimistic UI state
  const [optimisticCompleted, setOptimisticCompleted] = useState(isCompleted);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    const newCompletedState = !optimisticCompleted;

    // Optimistic update
    setOptimisticCompleted(newCompletedState);

    startTransition(async () => {
      try {
        await toggleCanvasCompletion(canvas.id, newCompletedState);
        router.refresh();
      } catch (error) {
        // Revert on error
        setOptimisticCompleted(!newCompletedState);
        toast.error("فشل تحديث الحالة");
        console.error("Toggle completion error:", error);
      }
    });
  };

  return (
    <div className="group relative">
      <Link
        href={`/subjects/${subjectId}/chapters/${chapterId}/canvases/${canvas.id}`}
        onClick={e => !isAuthenticated && onCanvasClick(e)}
        className={cn("block", !isAuthenticated && "pointer-events-none")}
      >
        <Card
          className={cn(
            "hover:border-primary/50 flex h-full flex-col gap-0 p-0 transition-all hover:shadow-md",
            !isAuthenticated && "opacity-75"
          )}
        >
          <CardContent className="flex h-full flex-col p-0">
            {/* Thumbnail Area */}
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-t-xl">
              {canvas.imageUrl ? (
                <Image
                  src={canvas.imageUrl}
                  alt={canvas.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={cn(
                    "object-cover transition-all group-hover:scale-105",
                    optimisticCompleted && "opacity-50 saturate-0"
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "from-muted to-muted/50 flex h-full w-full items-center justify-center bg-gradient-to-br transition-all",
                    optimisticCompleted && "opacity-50 saturate-0"
                  )}
                >
                  {isAuthenticated ? (
                    <BookOpen className="text-muted-foreground/20 h-16 w-16" />
                  ) : (
                    <Lock className="text-muted-foreground/20 h-16 w-16" />
                  )}
                </div>
              )}

              {/* Checkbox - Top Right */}
              {isAuthenticated && (
                <button
                  onClick={handleToggleComplete}
                  disabled={isPending}
                  className={cn(
                    "bg-background/80 absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded border-2 backdrop-blur-sm transition-all hover:scale-110",
                    optimisticCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary",
                    isPending && "opacity-50"
                  )}
                  aria-label={
                    optimisticCompleted ? "تحديد كغير مكتمل" : "تحديد كمكتمل"
                  }
                >
                  {optimisticCompleted && <Check className="h-4 w-4" />}
                </button>
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
            <div className="flex h-28 flex-col p-3">
              <h3
                className={cn(
                  "line-clamp-2 leading-tight font-semibold transition-colors",
                  isAuthenticated && "group-hover:text-primary",
                  optimisticCompleted && "text-muted-foreground"
                )}
              >
                {stripTitlePrefix(canvas.title)}
              </h3>

              <p
                className={cn(
                  "text-muted-foreground mt-2 line-clamp-2 flex-1 text-sm leading-relaxed",
                  optimisticCompleted && "opacity-70"
                )}
              >
                {canvas.description || ""}
              </p>

              <div
                className={cn(
                  "text-muted-foreground mt-auto flex items-center gap-1.5 text-xs",
                  optimisticCompleted && "opacity-70"
                )}
              >
                <User className="h-3 w-3" />
                <span>{canvas.contributor.name || "مساهم"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
