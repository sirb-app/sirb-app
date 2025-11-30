import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ChapterPlaylists from "./_components/chapter-playlists";
import SubjectInfoCard from "./_components/subject-info-card";

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

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

  const topContributor = await prisma.canvas.groupBy({
    by: ["contributorId"],
    where: {
      chapter: {
        subjectId: parseInt(subjectId),
      },
      status: "APPROVED",
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 1,
  });

  let topContributorInfo = null;
  if (topContributor.length > 0) {
    const contributorData = await prisma.user.findUnique({
      where: { id: topContributor[0].contributorId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (contributorData) {
      topContributorInfo = {
        ...contributorData,
        _count: {
          canvases: topContributor[0]._count.id,
        },
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

  const subject = await getSubjectData(
    subjectId,
    session?.user.id ?? null
  );

  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      <section className="mb-12" aria-label="معلومات المقرر">
        <SubjectInfoCard
          subject={subject}
          isAuthenticated={!!session}
        />
      </section>

      <section aria-label="فصول المقرر">
        <ChapterPlaylists chapters={subject.chapters} subjectId={subject.id} />
      </section>
    </div>
  );
}
