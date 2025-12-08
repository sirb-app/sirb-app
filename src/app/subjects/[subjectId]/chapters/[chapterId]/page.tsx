import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ChapterContentTabs from "./_components/chapter-content-tabs";
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
        where: {
          status: "APPROVED",
          isDeleted: false,
        },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          sequence: true,
          netScore: true,
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
      quizzes: {
        where: {
          status: "APPROVED",
          isDeleted: false,
        },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          sequence: true,
          netScore: true,
          attemptCount: true,
          createdAt: true,
          contributor: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            select: {
              id: true,
            },
          },
          attempts: userId
            ? {
                where: { userId },
                orderBy: { score: "desc" },
                take: 1,
                select: {
                  score: true,
                  totalQuestions: true,
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

      {/* Content Tabs (Canvases & Quizzes) */}
      <ChapterContentTabs
        canvases={chapter.canvases}
        quizzes={chapter.quizzes}
        chapterId={chapter.id}
        subjectId={parseInt(subjectId)}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
