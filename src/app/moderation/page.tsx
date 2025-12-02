import { getModerationQueue } from "@/actions/moderation.action";
import { UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ModerationDashboard from "./_components/moderation-dashboard";

type PageProps = {
  searchParams: Promise<{
    subjectId?: string;
  }>;
};

export default async function ModerationPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  // Get User Role and Subjects
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      moderatedSubjects: {
        include: {
          subject: {
            select: { id: true, name: true, code: true },
          },
        },
      },
    },
  });

  if (!user) redirect("/auth/login");

  let subjects: { id: number; name: string; code: string }[] = [];

  if (user.role === UserRole.ADMIN) {
    subjects = await prisma.subject.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  } else {
    subjects = user.moderatedSubjects.map(ms => ms.subject);
  }

  if (subjects.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold">لا توجد صلاحيات إشراف</h1>
        <p className="text-muted-foreground">
          ليس لديك أي مواد مخصصة للإشراف عليها حالياً.
        </p>
      </div>
    );
  }

  // Determine current subject ID
  const { subjectId } = await searchParams;
  let currentSubjectId = subjectId ? parseInt(subjectId) : subjects[0].id;

  // Verify access to this subject if not admin
  if (user.role !== UserRole.ADMIN) {
    const hasAccess = subjects.some(s => s.id === currentSubjectId);
    if (!hasAccess) {
      currentSubjectId = subjects[0].id;
    }
  }

  const { pendingCanvases, pendingQuizzes, reports } =
    await getModerationQueue(currentSubjectId);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <ModerationDashboard
        subjects={subjects}
        currentSubjectId={currentSubjectId}
        pendingCanvases={pendingCanvases}
        pendingQuizzes={pendingQuizzes}
        reports={reports}
      />
    </div>
  );
}
