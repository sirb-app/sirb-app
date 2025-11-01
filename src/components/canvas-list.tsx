"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Prisma } from "@/generated/prisma";
import { useSession } from "@/lib/auth-client";
import { stripTitlePrefix } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type CanvasWithContributor = Prisma.CanvasGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
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
};

export default function CanvasList({
  canvases,
  chapterId,
  subjectId,
}: CanvasListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session;

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
          <p className="text-muted-foreground text-center text-sm">
            لا توجد محتويات في هذا الفصل بعد
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {canvases.map(canvas => (
        <CanvasCard
          key={canvas.id}
          canvas={canvas}
          chapterId={chapterId}
          subjectId={subjectId}
          onCanvasClick={handleCanvasClick}
        />
      ))}
    </div>
  );
}

type CanvasCardProps = {
  readonly canvas: CanvasWithContributor;
  readonly chapterId: number;
  readonly subjectId: number;
  readonly onCanvasClick: (e: React.MouseEvent, canvasId: number) => void;
};

function CanvasCard({
  canvas,
  chapterId,
  subjectId,
  onCanvasClick,
}: CanvasCardProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <Card className="group hover:border-primary/50 transition-all hover:shadow-md">
      <CardContent className="p-0">
        <Link
          href={`/subjects/${subjectId}/chapters/${chapterId}/canvases/${canvas.id}`}
          onClick={e => !isAuthenticated && onCanvasClick(e, canvas.id)}
          className={`flex items-start gap-4 p-4 transition-colors ${
            isAuthenticated
              ? "hover:bg-muted/50 cursor-pointer"
              : "cursor-not-allowed opacity-75"
          }`}
        >
          {/* Canvas Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3
                className={`line-clamp-2 font-semibold transition-colors ${
                  isAuthenticated
                    ? "group-hover:text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {stripTitlePrefix(canvas.title)}
              </h3>
              {!isAuthenticated && (
                <Lock className="text-muted-foreground h-4 w-4 shrink-0" />
              )}
            </div>
            {canvas.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {canvas.description}
              </p>
            )}
            <p className="text-muted-foreground mt-2 text-xs">
              بواسطة {canvas.contributor.name}
            </p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
