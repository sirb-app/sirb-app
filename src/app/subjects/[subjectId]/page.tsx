import ChapterPlaylists from "@/components/chapter-playlists";
import ChapterPlaylistsSkeleton from "@/components/chapter-playlists-skeleton";
import SubjectInfoCard from "@/components/subject-info-card";
import SubjectInfoSkeleton from "@/components/subject-info-skeleton";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ subjectId: string }>;
};

async function getSubjectData(subjectId: string) {
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
          canvases: {
            where: { status: "APPROVED" }, // Only show approved canvases
            orderBy: { sequence: "asc" }, // Order canvases by sequence
            select: {
              id: true,
              title: true,
              description: true,
              sequence: true,
            },
          },
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return subject;
}

export default async function Page({ params }: PageProps) {
  const { subjectId } = await params;
  const subject = await getSubjectData(subjectId);

  return (
    <div className="container mx-auto max-w-6xl px-3 py-8 md:px-8 lg:px-16">
      {/* Subject Info Card */}
      <section className="mb-8">
        <Suspense fallback={<SubjectInfoSkeleton />}>
          <SubjectInfoCard subject={subject} />
        </Suspense>
      </section>

      {/* Chapter Playlists */}
      <section>
        <Suspense fallback={<ChapterPlaylistsSkeleton />}>
          <ChapterPlaylists
            chapters={subject.chapters}
            subjectId={subject.id}
          />
        </Suspense>
      </section>
    </div>
  );
}
