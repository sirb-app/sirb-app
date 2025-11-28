import { getComments } from "@/actions/get-comments.action";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CanvasComments from "./_components/canvas-comments";
import CanvasContent from "./_components/canvas-content";
import CanvasContributorSection from "./_components/canvas-contributor-section";
import CanvasViewTracker from "./_components/canvas-view-tracker";

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
      isDeleted: false, // Exclude soft-deleted canvases
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
          textContent: true,
          video: {
            include: {
              progress: {
                where: { userId },
                select: { lastPosition: true },
              },
            },
          },
          file: true,
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

  // Access Control
  if (canvas.status !== "APPROVED") {
    const isContributor = canvas.contributorId === userId;

    let isModeratorOrAdmin = false;
    if (!isContributor) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          moderatedSubjects: {
            where: { subjectId: parseInt(subjectId) },
          },
        },
      });

      if (
        user?.role === "ADMIN" ||
        (user?.moderatedSubjects && user.moderatedSubjects.length > 0)
      ) {
        isModeratorOrAdmin = true;
      }
    }

    if (!isContributor && !isModeratorOrAdmin) {
      notFound();
    }
  }

  // No need to manually fetch content anymore - it's included in contentBlocks
  return {
    ...canvas,
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

  const [canvas, initialCommentsData] = await Promise.all([
    getCanvasData(subjectId, chapterId, canvasId, session.user.id),
    getComments(parseInt(canvasId), undefined, "best"),
  ]);

  const isPreviewMode = canvas.status !== "APPROVED";

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Client-side view tracking - only tracks when user actually views the page */}
      <CanvasViewTracker
        canvasId={canvas.id}
        isApproved={canvas.status === "APPROVED"}
      />

      {isPreviewMode && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <div className="container mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium md:text-base">
                أنت تشاهد نسخة معاينة (الحالة:{" "}
                {canvas.status === "DRAFT"
                  ? "مسودة"
                  : canvas.status === "PENDING"
                    ? "قيد المراجعة"
                    : "مرفوض"}
                )
              </span>
            </div>
            {canvas.contributorId === session.user.id && (
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/10"
                asChild
              >
                <Link href={`/manage/canvas/${canvas.id}`}>
                  العودة للتعديل
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <CanvasContent canvas={canvas} userId={session.user.id} />

        <div className="mt-8" />

        {/* Only show actions and comments if approved */}
        {!isPreviewMode && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
