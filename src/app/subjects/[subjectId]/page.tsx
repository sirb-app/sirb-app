import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ChapterPlaylists from "./_components/chapter-playlists";
import SubjectInfoCard from "./_components/subject-info-card";

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { subjectId } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id: parseInt(subjectId) },
    select: { name: true, code: true },
  });

  if (!subject) {
    return {
      title: "المادة غير موجودة | سرب",
    };
  }

  return {
    title: `${subject.name} (${subject.code}) | سرب`,
    description: `استكشف محتوى مادة ${subject.name} في منصة سرب`,
  };
}

async function getSubjectData(subjectId: string, userId: string | null) {
  const subject = await prisma.subject.findUnique({
    where: { id: parseInt(subjectId) },
    include: {
      college: {
        include: {
          university: true,
        },
      },
      chapters: {
        orderBy: { sequence: "asc" },
        include: {
          _count: {
            select: {
              canvases: {
                where: { status: "APPROVED" },
              },
            },
          },
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  // Get top contributor by subject-specific points (not global points)
  const topContributorByPoints = await prisma.userPoints.groupBy({
    by: ["userId"],
    where: {
      subjectId: parseInt(subjectId),
    },
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
    take: 1,
  });

  let topContributorInfo = null;
  if (
    topContributorByPoints.length > 0 &&
    (topContributorByPoints[0]._sum.points ?? 0) > 0
  ) {
    const contributorData = await prisma.user.findUnique({
      where: { id: topContributorByPoints[0].userId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (contributorData) {
      topContributorInfo = {
        ...contributorData,
        points: topContributorByPoints[0]._sum.points ?? 0,
      };
    }
  }

  let isEnrolled = false;
  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId: parseInt(subjectId),
        },
      },
    });
    isEnrolled = !!enrollment;
  }

  return { ...subject, topContributor: topContributorInfo, isEnrolled };
}

export default async function Page({ params }: PageProps) {
  const { subjectId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const subject = await getSubjectData(subjectId, session?.user.id ?? null);

  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      <section className="mb-12" aria-label="معلومات المقرر">
        <SubjectInfoCard subject={subject} isAuthenticated={!!session} />
      </section>

      <section aria-label="فصول المقرر">
        <ChapterPlaylists chapters={subject.chapters} subjectId={subject.id} />
      </section>
    </div>
  );
}
