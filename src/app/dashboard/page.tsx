import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardStats from "./_components/dashboard-stats";
import DashboardTabs from "./_components/dashboard-tabs";

async function getDashboardData(userId: string) {
  const [contributedCanvases, contributedQuizzes, enrollments, userStats] = await Promise.all([
    prisma.canvas.findMany({
      where: {
        contributorId: userId,
        isDeleted: false,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            contentBlocks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.quiz.findMany({
      where: {
        contributorId: userId,
        isDeleted: false,
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.enrollment.findMany({
      where: { userId },
      include: {
        subject: {
          include: {
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
            college: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),

    prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPoints: true,
        _count: {
          select: {
            contributedCanvases: {
              where: { isDeleted: false },
            },
            contributedQuizzes: {
              where: { isDeleted: false },
            },
            enrollments: true,
            canvasProgress: {
              where: {
                completedAt: { not: null },
              },
            },
          },
        },
      },
    }),
  ]);

  const subjectIds = enrollments.map(e => e.subject.id);
  const allCompletions = await prisma.canvasProgress.groupBy({
    by: ["canvasId"],
    where: {
      userId,
      completedAt: { not: null },
      canvas: {
        chapter: {
          subjectId: { in: subjectIds },
        },
        status: "APPROVED",
      },
    },
    _count: {
      canvasId: true,
    },
  });

  const completedCanvasIds = allCompletions.map(c => c.canvasId);
  const completedCanvases = completedCanvasIds.length > 0
    ? await prisma.canvas.findMany({
        where: { id: { in: completedCanvasIds } },
        select: {
          id: true,
          chapter: {
            select: {
              subjectId: true,
            },
          },
        },
      })
    : [];

  const completionsBySubject = completedCanvases.reduce((acc, canvas) => {
    const subjectId = canvas.chapter.subjectId;
    acc[subjectId] = (acc[subjectId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const enrollmentsWithProgress = enrollments.map(enrollment => {
    const totalCanvases = enrollment.subject.chapters.reduce(
      (sum, ch) => sum + ch._count.canvases,
      0
    );

    const completedCanvases = completionsBySubject[enrollment.subject.id] || 0;

    return {
      ...enrollment,
      progress: {
        total: totalCanvases,
        completed: completedCanvases,
        percentage:
          totalCanvases > 0
            ? Math.round((completedCanvases / totalCanvases) * 100)
            : 0,
      },
    };
  });

  const canvasesByStatus = {
    DRAFT: contributedCanvases.filter(c => c.status === "DRAFT"),
    PENDING: contributedCanvases.filter(c => c.status === "PENDING"),
    REJECTED: contributedCanvases.filter(c => c.status === "REJECTED"),
    APPROVED: contributedCanvases.filter(c => c.status === "APPROVED"),
  };

  const quizzesByStatus = {
    DRAFT: contributedQuizzes.filter(q => q.status === "DRAFT"),
    PENDING: contributedQuizzes.filter(q => q.status === "PENDING"),
    REJECTED: contributedQuizzes.filter(q => q.status === "REJECTED"),
    APPROVED: contributedQuizzes.filter(q => q.status === "APPROVED"),
  };

  return {
    canvasesByStatus,
    quizzesByStatus,
    enrollments: enrollmentsWithProgress,
    stats: {
      totalContributions:
        (userStats?._count.contributedCanvases || 0) +
        (userStats?._count.contributedQuizzes || 0),
      totalEnrollments: userStats?._count.enrollments || 0,
      completedCanvases: userStats?._count.canvasProgress || 0,
      totalPoints: userStats?.totalPoints || 0,
    },
  };
}

export default async function DashboardPage() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/auth/login");
  }

  const dashboardData = await getDashboardData(session.user.id);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">لوحة التحكم</h1>

      <DashboardStats stats={dashboardData.stats} />

      <div className="mt-8">
        <DashboardTabs
          canvasesByStatus={dashboardData.canvasesByStatus}
          quizzesByStatus={dashboardData.quizzesByStatus}
          enrollments={dashboardData.enrollments}
        />
      </div>
    </div>
  );
}
