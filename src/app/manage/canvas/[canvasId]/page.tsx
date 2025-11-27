import { ContentStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CanvasFooterActions from "./_components/canvas-footer-actions";
import CanvasHeader from "./_components/canvas-header";
import ContentBlockList from "./_components/content-block-list";

type PageProps = {
  params: Promise<{
    canvasId: string;
  }>;
};

async function getCanvasDetails(canvasId: number, userId: string) {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      contentBlocks: {
        orderBy: { sequence: "asc" },
      },
      chapter: {
        select: {
          subjectId: true,
        },
      },
    },
  });

  if (!canvas) return null;

  if (canvas.contributorId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return "UNAUTHORIZED";
    }
  }

  // Fetch content details
  const textIds = canvas.contentBlocks
    .filter(b => b.contentType === "TEXT")
    .map(b => b.contentId);
  const videoIds = canvas.contentBlocks
    .filter(b => b.contentType === "VIDEO")
    .map(b => b.contentId);
  const fileIds = canvas.contentBlocks
    .filter(b => b.contentType === "FILE")
    .map(b => b.contentId);

  const [textContents, videos, files] = await Promise.all([
    prisma.textContent.findMany({ where: { id: { in: textIds } } }),
    prisma.video.findMany({ where: { id: { in: videoIds } } }),
    prisma.file.findMany({ where: { id: { in: fileIds } } }),
  ]);

  const blocksWithData = canvas.contentBlocks.map(block => {
    let data = null;
    if (block.contentType === "TEXT") {
      data = textContents.find(t => t.id === block.contentId);
    } else if (block.contentType === "VIDEO") {
      data = videos.find(v => v.id === block.contentId);
    } else if (block.contentType === "FILE") {
      data = files.find(f => f.id === block.contentId);
    }
    return { ...block, data };
  });

  return { ...canvas, contentBlocks: blocksWithData };
}

export default async function CanvasManagePage({ params }: PageProps) {
  const { canvasId } = await params;
  const id = parseInt(canvasId);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const canvas = await getCanvasDetails(id, session.user.id);

  if (canvas === "UNAUTHORIZED") {
    return (
      <div className="text-destructive container py-10 text-center">
        ليس لديك صلاحية لتعديل هذا المحتوى
      </div>
    );
  }

  if (!canvas) {
    notFound();
  }

  const isReadOnly = canvas.status === ContentStatus.PENDING;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <CanvasHeader canvas={canvas} />

      <div className="mt-8">
        <ContentBlockList
          initialBlocks={canvas.contentBlocks as any}
          canvasId={canvas.id}
          isReadOnly={isReadOnly}
        />
      </div>

      <CanvasFooterActions
        canvasId={canvas.id}
        status={canvas.status}
        hasContent={canvas.contentBlocks.length > 0}
      />
    </div>
  );
}
