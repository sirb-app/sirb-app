"use server";

import { ReportReason } from "@/generated/prisma";
import { auth } from "@/lib/auth";
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

    return { success: true };
  } catch (error) {
    console.error("Error reporting comment:", error);
    return { success: false, error: "فشل في إرسال البلاغ" };
  }
}
