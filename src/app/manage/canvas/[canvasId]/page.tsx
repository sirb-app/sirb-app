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
        include: {
          textContent: true,
          video: true,
          file: true,
          canvasQuestion: {
            include: {
              options: {
                orderBy: { sequence: "asc" },
              },
            },
          },
        },
      },
      chapter: {
        select: {
          subjectId: true,
        },
      },
    },
  });

  if (!canvas || canvas.isDeleted) return null;

  if (canvas.contributorId !== userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return "UNAUTHORIZED";
    }
  }

  // Map blocks to include data field for compatibility with existing components
  const blocksWithData = canvas.contentBlocks.map(block => {
    let data = null;
    if (block.contentType === "TEXT" && block.textContent) {
      data = block.textContent;
    } else if (block.contentType === "VIDEO" && block.video) {
      data = block.video;
    } else if (block.contentType === "FILE" && block.file) {
      data = block.file;
    } else if (block.contentType === "QUESTION" && block.canvasQuestion) {
      data = block.canvasQuestion;
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
    <div className="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 md:py-8">
      <CanvasHeader canvas={canvas} />

      <div className="mt-4 sm:mt-6 md:mt-8">
        <ContentBlockList
          initialBlocks={canvas.contentBlocks.map(block => ({
            id: block.id,
            sequence: block.sequence,
            contentType: block.contentType as
              | "TEXT"
              | "VIDEO"
              | "FILE"
              | "QUESTION",
            data: block.data,
          }))}
          canvasId={canvas.id}
          previewUrl={`/subjects/${canvas.chapter.subjectId}/chapters/${canvas.chapterId}/canvases/${canvas.id}`}
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
