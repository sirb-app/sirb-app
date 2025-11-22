import { markCanvasComplete } from "@/actions/canvas-progress.action";
import { trackCanvasView } from "@/actions/canvas-view.action";
import { getComments } from "@/actions/get-comments.action";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CanvasComments from "./_components/canvas-comments";
import CanvasContent from "./_components/canvas-content";
import CanvasContributorSection from "./_components/canvas-contributor-section";

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
      contributor: {
        select: {
          id: true,
          name: true,
          image: true,
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
      votes: {
        where: { userId },
        select: { voteType: true },
      },
    },
  });

  if (!canvas) {
    notFound();
  }

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
    userVote: canvas.votes[0]?.voteType || null,
  };
}

export default async function Page({ params }: PageProps) {
  const { subjectId, chapterId, canvasId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      `/auth/login?callbackUrl=/subjects/${subjectId}/chapters/${chapterId}/canvases/${canvasId}`
    );
  }

  await markCanvasComplete(parseInt(canvasId));
  await trackCanvasView(parseInt(canvasId));

  const [canvas, initialCommentsData] = await Promise.all([
    getCanvasData(subjectId, chapterId, canvasId, session.user.id),
    getComments(parseInt(canvasId), undefined, "best"),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <CanvasContent canvas={canvas} userId={session.user.id} />

        <div className="mt-8" />

        <CanvasContributorSection
          canvas={{
            id: canvas.id,
            contributorId: canvas.contributorId,
            createdAt: canvas.createdAt,
            upvotesCount: (canvas as any).upvotesCount,
            downvotesCount: (canvas as any).downvotesCount,
            netScore: (canvas as any).netScore,
            viewCount: (canvas as any).viewCount,
            contributor: canvas.contributor,
          }}
          userVote={canvas.userVote}
          isAuthenticated={true}
        />

        <CanvasComments
          canvasId={canvas.id}
          contributorId={canvas.contributorId}
          initialComments={initialCommentsData.comments}
          initialNextCursor={initialCommentsData.nextCursor}
          initialHasMore={initialCommentsData.hasMore}
          currentUser={{
            id: session.user.id,
            name: session.user.name,
            image: session.user.image ?? null,
          }}
          isAuthenticated={true}
        />
      </div>
    </div>
  );
}
