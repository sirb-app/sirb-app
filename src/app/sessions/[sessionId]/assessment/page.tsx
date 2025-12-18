import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AssessmentClient } from "./_components/assessment-client";
import { AssessmentResults } from "./_components/assessment-results";

async function getStudyPlan(studyPlanId: string) {
  const studyPlan = await prisma.studyPlan.findUnique({
    where: { id: studyPlanId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      masteryRecords: {
        select: {
          proficiencyScore: true,
        },
      },
    },
  });

  return studyPlan;
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const studyPlan = await getStudyPlan(sessionId);

  if (!studyPlan) {
    notFound();
  }

  if (studyPlan.userId !== session.user.id) {
    redirect("/subjects");
  }

  if (studyPlan.placementCompleted) {
    const masteryRecords = studyPlan.masteryRecords;
    const topicsMastered = masteryRecords.filter(m => m.proficiencyScore >= 80).length;
    const topicsInProgress = masteryRecords.filter(m => m.proficiencyScore > 0 && m.proficiencyScore < 80).length;
    const averageProficiency = masteryRecords.length > 0
      ? masteryRecords.reduce((sum, m) => sum + m.proficiencyScore, 0) / masteryRecords.length
      : 0;

    return (
      <AssessmentResults
        studyPlanId={studyPlan.id}
        subject={studyPlan.subject}
        results={{
          topicsMastered,
          topicsInProgress,
          totalTopics: masteryRecords.length,
          averageProficiency,
        }}
      />
    );
  }

  return (
    <AssessmentClient
      studyPlanId={studyPlan.id}
      subject={studyPlan.subject}
    />
  );
}
