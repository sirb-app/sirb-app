"use client";

import { Button } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma";
import { useSession } from "@/lib/auth-client";
import { stripTitlePrefix } from "@/lib/utils";
import { ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

type ChapterPlaylistItemProps = {
  readonly chapter: ChapterWithCanvases;
  readonly subjectId: number;
};

export default function ChapterPlaylistItem({
  chapter,
  subjectId,
}: ChapterPlaylistItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasCount = chapter.canvases.length;
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthenticated = !!session;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

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

  return (
    <div className="group transition-colors">
      {/* Chapter Header */}
      <div className="hover:bg-muted/50 flex items-center gap-3 p-4">
        {/* Chapter Number Badge */}
        <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded text-sm font-semibold">
          {chapter.sequence}
        </div>

        {/* Chapter Details */}
        <Link
          href={`/subjects/${subjectId}/chapters/${chapter.id}`}
          className="group/chapter hover:text-primary flex min-w-0 flex-1 gap-3 transition-colors"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Title */}
            <h3 className="line-clamp-2 leading-tight font-medium transition-colors">
              {stripTitlePrefix(chapter.title)}
            </h3>

            {/* Description */}
            {chapter.description && (
              <p className="text-muted-foreground line-clamp-1 text-sm">
                {chapter.description}
              </p>
            )}

            {/* Canvas Count */}
            <span className="text-muted-foreground text-xs">
              عدد المحتويات: {canvasCount}
            </span>
          </div>
        </Link>

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggleExpand}
          type="button"
          aria-label={isExpanded ? "إخفاء المحتويات" : "عرض المحتويات"}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isExpanded ? "" : "-rotate-90"
            }`}
          />
        </Button>
      </div>

      {/* Canvas List - Expandable */}
      {isExpanded && canvasCount > 0 && (
        <div className="bg-muted/30 border-t">
          <div className="space-y-1 p-2">
            {chapter.canvases.map(canvas => (
              <Link
                key={canvas.id}
                href={`/subjects/${subjectId}/chapters/${chapter.id}/canvases/${canvas.id}`}
                onClick={e =>
                  !isAuthenticated && handleCanvasClick(e, canvas.id)
                }
                className={`group/canvas flex items-start gap-3 rounded-md p-3 transition-all ${
                  isAuthenticated
                    ? "hover:bg-background hover:text-primary cursor-pointer"
                    : "cursor-not-allowed opacity-75"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p
                      className={`text-sm leading-tight font-medium transition-colors ${
                        !isAuthenticated ? "text-muted-foreground" : ""
                      }`}
                    >
                      {stripTitlePrefix(canvas.title)}
                    </p>
                    {!isAuthenticated && (
                      <Lock className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    )}
                  </div>
                  {canvas.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                      {canvas.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
