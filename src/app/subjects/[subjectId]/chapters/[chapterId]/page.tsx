import CanvasList from "@/components/canvas-list";
import ChapterInfo from "@/components/chapter-info";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    subjectId: string;
    chapterId: string;
  }>;
};

async function getChapterData(subjectId: string, chapterId: string) {
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

  // Fetch chapter data and session in parallel
  const [chapter, session] = await Promise.all([
    getChapterData(subjectId, chapterId),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  const isAuthenticated = !!session;

  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Chapter Info on Top */}
      <section className="mb-8" aria-label="معلومات الفصل">
        <ChapterInfo chapter={chapter} subjectId={parseInt(subjectId)} />
      </section>

      {/* Canvas Grid Below */}
      <section aria-label="قائمة المحتويات">
        <CanvasList
          canvases={chapter.canvases}
          chapterId={chapter.id}
          subjectId={parseInt(subjectId)}
          isAuthenticated={isAuthenticated}
        />
      </section>
    </div>
  );
}
