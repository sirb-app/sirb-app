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
      throw new Error("تم الإبلاغ مسبقاً");
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
    if (error instanceof Error && error.message === "تم الإبلاغ مسبقاً") {
      throw error;
    }
    throw new Error("Failed to report canvas");
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
      throw new Error("تم الإبلاغ مسبقاً");
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
    if (error instanceof Error && error.message === "تم الإبلاغ مسبقاً") {
      throw error;
    }
    throw new Error("Failed to report comment");
  }
}
