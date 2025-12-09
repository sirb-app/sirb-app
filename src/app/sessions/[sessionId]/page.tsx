import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionClient } from "./_components/session-client";

async function getStudyPlanSession(studyPlanId: string, userId: string) {
  const studyPlan = await prisma.studyPlan.findUnique({
    where: { id: studyPlanId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          chapters: {
            where: {
              id: { in: [] }, // Will be filtered below
            },
            orderBy: { sequence: "asc" },
            select: {
              id: true,
              title: true,
              sequence: true,
            },
          },
        },
      },
      masteryRecords: {
        select: {
          proficiencyScore: true,
        },
      },
      adaptiveQuizzes: {
        where: { completedAt: { not: null } },
        select: { id: true },
      },
    },
  });

  if (!studyPlan || studyPlan.userId !== userId) {
    return null;
  }

  // Get chapters that are in selectedChapterIds
  const chapters = await prisma.chapter.findMany({
    where: {
      id: { in: studyPlan.selectedChapterIds },
      subjectId: studyPlan.subjectId,
    },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      title: true,
      sequence: true,
    },
  });

  // Calculate stats
  const masteryRecords = studyPlan.masteryRecords;
  const topicsMastered = masteryRecords.filter(m => m.proficiencyScore >= 80).length;
  const topicsInProgress = masteryRecords.filter(m => m.proficiencyScore > 0 && m.proficiencyScore < 80).length;

  return {
    id: studyPlan.id,
    title: studyPlan.title,
    placementCompleted: studyPlan.placementCompleted,
    subject: {
      id: studyPlan.subject.id,
      name: studyPlan.subject.name,
      code: studyPlan.subject.code,
    },
    chapters,
    stats: {
      topicsMastered,
      topicsInProgress,
      totalTopics: masteryRecords.length,
      quizzesCompleted: studyPlan.adaptiveQuizzes.length,
      flashcardsReviewed: 0, // TODO: Track this
    },
  };
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const data = await getStudyPlanSession(sessionId, session.user.id);

  if (!data) {
    notFound();
  }

  return <SessionClient session={data} />;
}

