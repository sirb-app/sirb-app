import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CanvasContent from "./_components/canvas-content";
import CanvasSidebar from "./_components/canvas-sidebar";

type PageProps = {
  params: Promise<{
    subjectId: string;
    chapterId: string;
    canvasId: string;
  }>;
};

async function getCanvasData(
  subjectId: string,
  chapterId: string,
  canvasId: string,
  userId: string
) {
  const canvas = await prisma.canvas.findUnique({
    where: {
      id: parseInt(canvasId),
      chapterId: parseInt(chapterId),
      status: "APPROVED",
    },
    include: {
      chapter: {
        include: {
          subject: {
            include: {
              college: {
                include: {
                  university: true,
                },
              },
              chapters: {
                orderBy: { sequence: "asc" },
                include: {
                  canvases: {
                    where: { status: "APPROVED" },
                    orderBy: { sequence: "asc" },
                    select: {
                      id: true,
                      title: true,
                      sequence: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      videos: {
        orderBy: { sequence: "asc" },
        include: {
          progress: {
            where: { userId },
            select: { lastPosition: true },
          },
        },
      },
      files: {
        orderBy: { sequence: "asc" },
      },
      quizzes: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!canvas) {
    notFound();
  }

  return canvas;
}

export default async function Page({ params }: PageProps) {
  const { subjectId, chapterId, canvasId } = await params;

  // Page-level authentication check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=/subjects/${subjectId}/chapters/${chapterId}/canvases/${canvasId}`
    );
  }

  const canvas = await getCanvasData(
    subjectId,
    chapterId,
    canvasId,
    session.user.id
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <CanvasSidebar
        subject={canvas.chapter.subject}
        currentChapterId={canvas.chapterId}
        currentCanvasId={canvas.id}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Content */}
        <div className="bg-muted/30 flex-1 overflow-y-auto">
          <CanvasContent canvas={canvas} userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
