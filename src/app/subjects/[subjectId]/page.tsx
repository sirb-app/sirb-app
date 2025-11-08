import ChapterPlaylists from "@/components/chapter-playlists";
import SubjectInfoCard from "@/components/subject-info-card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

  return subject;
}

export default async function Page({ params }: PageProps) {
  const { subjectId } = await params;
  const subject = await getSubjectData(subjectId);

  return (
    <div className="container mx-auto max-w-7xl px-3 py-8 md:px-8 lg:px-16">
      {/* Subject Info Card */}
      <section className="mb-12" aria-label="معلومات المقرر">
        <SubjectInfoCard subject={subject} />
      </section>

      {/* Chapter Playlists */}
      <section aria-label="فصول المقرر">
        <ChapterPlaylists chapters={subject.chapters} subjectId={subject.id} />
      </section>
    </div>
  );
}
