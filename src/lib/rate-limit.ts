import { prisma } from "./prisma";

export async function checkRateLimit(
  userId: string,
  action: "comment" | "report",
  limit: number = 5
): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60000);

  if (action === "comment") {
    const recentComments = await prisma.comment.count({
      where: {
        userId: userId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentComments >= limit) {
      throw new Error("يرجى الانتظار قبل إضافة تعليق آخر");
    }
  } else if (action === "report") {
    const recentReports = await prisma.report.count({
      where: {
        reporterUserId: userId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentReports >= limit) {
      throw new Error("يرجى الانتظار قبل إرسال بلاغ آخر");
    }
  }
}

