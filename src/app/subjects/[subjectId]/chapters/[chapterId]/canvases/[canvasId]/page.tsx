import { markCanvasComplete } from "@/actions/canvas-progress.action";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CanvasContent from "./_components/canvas-content";

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
        select: {
          id: true,
          title: true,
          sequence: true,
          subjectId: true,
        },
      },
      contentBlocks: {
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          sequence: true,
          contentType: true,
          contentId: true,
        },
      },
    },
  });

  if (!canvas) {
    notFound();
  }

  // Fetch all content based on contentBlocks
  const textIds: number[] = [];
  const videoIds: number[] = [];
  const fileIds: number[] = [];

  canvas.contentBlocks.forEach(block => {
    if (block.contentType === "TEXT") textIds.push(block.contentId);
    else if (block.contentType === "VIDEO") videoIds.push(block.contentId);
    else if (block.contentType === "FILE") fileIds.push(block.contentId);
  });

  const [textContents, videos, files] = await Promise.all([
    prisma.textContent.findMany({
      where: { id: { in: textIds } },
    }),
    prisma.video.findMany({
      where: { id: { in: videoIds } },
      include: {
        progress: {
          where: { userId },
          select: { lastPosition: true },
        },
      },
    }),
    prisma.file.findMany({
      where: { id: { in: fileIds } },
    }),
  ]);

  // Create lookup maps for efficient access
  const textMap = new Map(textContents.map(t => [t.id, t]));
  const videoMap = new Map(videos.map(v => [v.id, v]));
  const fileMap = new Map(files.map(f => [f.id, f]));

  return {
    ...canvas,
    textMap,
    videoMap,
    fileMap,
  };
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

  // Auto-mark canvas as complete on entry
  await markCanvasComplete(parseInt(canvasId));

  const canvas = await getCanvasData(
    subjectId,
    chapterId,
    canvasId,
    session.user.id
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <CanvasContent canvas={canvas} userId={session.user.id} />
      </div>
    </div>
  );
}
