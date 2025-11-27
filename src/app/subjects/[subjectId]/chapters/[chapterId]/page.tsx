import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AddCanvasButton from "./_components/add-canvas-button";
import CanvasList from "./_components/canvas-list";
import ChapterInfo from "./_components/chapter-info";

type PageProps = {
  params: Promise<{
    subjectId: string;
    chapterId: string;
  }>;
};

async function getChapterData(
  subjectId: string,
  chapterId: string,
  userId?: string
) {
  const chapter = await prisma.chapter.findUnique({
    where: {
      id: parseInt(chapterId),
      subjectId: parseInt(subjectId),
    },
    select: {
      id: true,
      title: true,
      description: true,
      sequence: true,
      canvases: {
        where: { status: "APPROVED" },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          sequence: true,
          createdAt: true,
          contributor: {
            select: {
              id: true,
              name: true,
            },
          },
          userProgress: userId
            ? {
                where: { userId },
                select: {
                  completedAt: true,
                },
              }
            : false,
        },
      },
    },
  });

  if (!chapter) {
    notFound();
  }

  return chapter;
}

export default async function Page({ params }: PageProps) {
  const { subjectId, chapterId } = await params;

  // Fetch session first to get userId
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = !!session;

  // Fetch chapter data with user progress
  const chapter = await getChapterData(subjectId, chapterId, session?.user?.id);

  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Chapter Info on Top */}
      <section className="mb-8" aria-label="معلومات الفصل">
        <ChapterInfo chapter={chapter} subjectId={parseInt(subjectId)} />
      </section>

      {/* Header & Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">الشروحات</h2>
        {isAuthenticated && chapter.canvases.length > 0 && (
          <AddCanvasButton chapterId={chapter.id} hasCanvases={true} />
        )}
      </div>

      {/* Canvas Grid Below */}
      <section aria-label="قائمة المحتويات">
        {chapter.canvases.length > 0 ? (
          <CanvasList
            canvases={chapter.canvases}
            chapterId={chapter.id}
            subjectId={parseInt(subjectId)}
            isAuthenticated={isAuthenticated}
          />
        ) : isAuthenticated ? (
          <AddCanvasButton chapterId={chapter.id} hasCanvases={false} />
        ) : (
          <CanvasList
            canvases={[]}
            chapterId={chapter.id}
            subjectId={parseInt(subjectId)}
            isAuthenticated={isAuthenticated}
          />
        )}
      </section>
    </div>
  );
}
