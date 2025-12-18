"use server";

import { ReportReason } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { notifyModeratorsOfReport } from "@/lib/email/email-service";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const ReportQuizSchema = z.object({
  quizId: z.number(),
  reason: z.enum([
    "SPAM",
    "INAPPROPRIATE",
    "WRONG_INFO",
    "HARASSMENT",
    "COPYRIGHT",
    "OTHER",
  ]),
  description: z.string().max(500).optional(),
});

const ReportQuizCommentSchema = z.object({
  commentId: z.number(),
  reason: z.enum([
    "SPAM",
    "INAPPROPRIATE",
    "WRONG_INFO",
    "HARASSMENT",
    "COPYRIGHT",
    "OTHER",
  ]),
  description: z.string().max(500).optional(),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// --- Quiz Report Actions ---

export async function reportQuiz(data: z.infer<typeof ReportQuizSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReportQuizSchema.parse(data);

  // Check if user already reported this quiz
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterUserId: session.user.id,
      reportedQuizId: validated.quizId,
      status: { in: ["PENDING", "RESOLVED"] }, // Don't allow duplicate active reports
    },
  });

  if (existingReport) {
    return { success: false, error: "تم الإبلاغ مسبقاً" };
  }

  try {
    await prisma.report.create({
      data: {
        reporterUserId: session.user.id,
        reportedQuizId: validated.quizId,
        reason: validated.reason as ReportReason,
        description: validated.description,
      },
    });

    // Notify moderators of the new report (fire and forget)
    const quizData = await prisma.quiz.findUnique({
      where: { id: validated.quizId },
      include: {
        chapter: {
          include: {
            subject: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (quizData) {
      notifyModeratorsOfReport({
        subjectId: quizData.chapter.subject.id,
        subjectName: quizData.chapter.subject.name,
        reporterName: session.user.name,
        reportReason: validated.reason,
        reportDescription: validated.description,
        reportedContentType: "QUIZ",
        reportedContentTitle: quizData.title,
      }).catch(err =>
        console.error("[Email] Failed to notify moderators:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error reporting quiz:", error);
    return { success: false, error: "فشل في إرسال البلاغ" };
  }
}

export async function reportQuizComment(
  data: z.infer<typeof ReportQuizCommentSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReportQuizCommentSchema.parse(data);

  // Check if user already reported this comment
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterUserId: session.user.id,
      reportedQuizCommentId: validated.commentId,
      status: { in: ["PENDING", "RESOLVED"] },
    },
  });

  if (existingReport) {
    return { success: false, error: "تم الإبلاغ مسبقاً" };
  }

  try {
    await prisma.report.create({
      data: {
        reporterUserId: session.user.id,
        reportedQuizCommentId: validated.commentId,
        reason: validated.reason as ReportReason,
        description: validated.description,
      },
    });

    // Notify moderators of the new report (fire and forget)
    const commentData = await prisma.quizComment.findUnique({
      where: { id: validated.commentId },
      include: {
        quiz: {
          include: {
            chapter: {
              include: {
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (commentData) {
      notifyModeratorsOfReport({
        subjectId: commentData.quiz.chapter.subject.id,
        subjectName: commentData.quiz.chapter.subject.name,
        reporterName: session.user.name,
        reportReason: validated.reason,
        reportDescription: validated.description,
        reportedContentType: "QUIZ_COMMENT",
        reportedContentTitle: commentData.text.slice(0, 50),
      }).catch(err =>
        console.error("[Email] Failed to notify moderators:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error reporting quiz comment:", error);
    return { success: false, error: "فشل في إرسال البلاغ" };
  }
}
