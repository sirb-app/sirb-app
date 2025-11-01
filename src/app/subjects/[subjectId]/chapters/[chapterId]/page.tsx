import CanvasList from "@/components/canvas-list";
import ChapterInfo from "@/components/chapter-info";
import { prisma } from "@/lib/prisma";
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
    include: {
      subject: {
        include: {
          college: {
            include: {
              university: true,
            },
          },
        },
      },
      canvases: {
        where: { status: "APPROVED" },
        orderBy: { sequence: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
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
  const chapter = await getChapterData(subjectId, chapterId);

  return (
    <div className="container mx-auto max-w-6xl px-3 py-8 md:px-8 lg:px-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Left Pane - Chapter Info (1/3 on desktop, full width on mobile) */}
        <div className="lg:w-1/3">
          <ChapterInfo chapter={chapter} subjectId={parseInt(subjectId)} />
        </div>

        {/* Right Pane - Canvas List (2/3 on desktop, full width on mobile) */}
        <div className="lg:w-2/3">
          <CanvasList
            canvases={chapter.canvases}
            chapterId={chapter.id}
            subjectId={parseInt(subjectId)}
          />
        </div>
      </div>
    </div>
  );
}
