"use server";

import { ReportReason } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { notifyModeratorsOfReport } from "@/lib/email/email-service";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function reportCanvas(
  canvasId: number,
  reason: ReportReason,
  description?: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (description && description.trim().length > 500) {
    throw new Error("Description too long");
  }

  await checkRateLimit(session.user.id, "report");

  try {
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterUserId: session.user.id,
        reportedCanvasId: canvasId,
      },
    });

    if (existingReport) {
      return { success: false, error: "تم الإبلاغ مسبقاً" };
    }

    await prisma.report.create({
      data: {
        reason: reason,
        description: description?.trim() || null,
        reporterUserId: session.user.id,
        reportedCanvasId: canvasId,
      },
    });

    // Notify moderators of the new report (fire and forget)
    const canvasData = await prisma.canvas.findUnique({
      where: { id: canvasId },
      include: {
        chapter: {
          include: {
            subject: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (canvasData) {
      notifyModeratorsOfReport({
        subjectId: canvasData.chapter.subject.id,
        subjectName: canvasData.chapter.subject.name,
        reporterName: session.user.name,
        reportReason: reason,
        reportDescription: description?.trim(),
        reportedContentType: "CANVAS",
        reportedContentTitle: canvasData.title,
      }).catch(err =>
        console.error("[Email] Failed to notify moderators:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error reporting canvas:", error);
    return { success: false, error: "فشل في إرسال البلاغ" };
  }
}

export async function reportComment(
  commentId: number,
  reason: ReportReason,
  description?: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (description && description.trim().length > 500) {
    throw new Error("Description too long");
  }

  await checkRateLimit(session.user.id, "report");

  try {
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterUserId: session.user.id,
        reportedCommentId: commentId,
      },
    });

    if (existingReport) {
      return { success: false, error: "تم الإبلاغ مسبقاً" };
    }

    await prisma.report.create({
      data: {
        reason: reason,
        description: description?.trim() || null,
        reporterUserId: session.user.id,
        reportedCommentId: commentId,
      },
    });

    // Notify moderators of the new report (fire and forget)
    const commentData = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        canvas: {
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
        subjectId: commentData.canvas.chapter.subject.id,
        subjectName: commentData.canvas.chapter.subject.name,
        reporterName: session.user.name,
        reportReason: reason,
        reportDescription: description?.trim(),
        reportedContentType: "COMMENT",
        reportedContentTitle: commentData.text.slice(0, 50),
      }).catch(err =>
        console.error("[Email] Failed to notify moderators:", err)
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error reporting comment:", error);
    return { success: false, error: "فشل في إرسال البلاغ" };
  }
}
