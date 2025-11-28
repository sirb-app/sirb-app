"use server";

import { ContentStatus, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const RejectCanvasSchema = z.object({
  canvasId: z.number(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

async function checkModeratorAccess(userId: string, subjectId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserRole.ADMIN) return true;

  const moderator = await prisma.subjectModerator.findUnique({
    where: {
      userId_subjectId: {
        userId,
        subjectId,
      },
    },
  });

  if (!moderator)
    throw new Error("Unauthorized: You are not a moderator for this subject");
  return true;
}

async function getCanvasWithSubject(canvasId: number) {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: {
      id: true,
      status: true,
      isDeleted: true,
      chapter: {
        select: {
          subjectId: true,
        },
      },
    },
  });

  if (!canvas || canvas.isDeleted) throw new Error("Canvas not found");
  return canvas;
}

// --- Actions ---

export async function getModerationQueue(subjectId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await checkModeratorAccess(session.user.id, subjectId);

  const pendingCanvases = await prisma.canvas.findMany({
    where: {
      chapter: { subjectId },
      status: ContentStatus.PENDING,
      isDeleted: false, // Exclude soft-deleted canvases
    },
    include: {
      contributor: {
        select: {
          name: true,
          image: true,
        },
      },
      chapter: {
        select: {
          title: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const reports = await prisma.report.findMany({
    where: {
      OR: [
        { reportedCanvas: { chapter: { subjectId }, isDeleted: false } },
        { reportedComment: { canvas: { chapter: { subjectId }, isDeleted: false } } },
      ],
      status: "PENDING",
    },
    include: {
      reporter: {
        select: { name: true },
      },
      reportedCanvas: {
        select: {
          id: true,
          title: true,
          chapterId: true,
          chapter: { select: { subjectId: true } },
        },
      },
      reportedComment: {
        select: {
          id: true,
          text: true,
          canvasId: true,
          canvas: {
            select: {
              id: true,
              chapterId: true,
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { pendingCanvases, reports };
}

export async function approveCanvas(canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const canvas = await getCanvasWithSubject(canvasId);
  await checkModeratorAccess(session.user.id, canvas.chapter.subjectId);

  await prisma.canvas.update({
    where: { id: canvasId },
    data: {
      status: ContentStatus.APPROVED,
      rejectionReason: null, // Clear any previous rejection reason
    },
  });

  // Award points to contributor (Optional, based on rules)
  // await awardPoints(canvas.contributorId, 50, "content_approved");

  return { success: true };
}

export async function rejectCanvas(data: z.infer<typeof RejectCanvasSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = RejectCanvasSchema.parse(data);
  const canvas = await getCanvasWithSubject(validated.canvasId);
  await checkModeratorAccess(session.user.id, canvas.chapter.subjectId);

  await prisma.canvas.update({
    where: { id: validated.canvasId },
    data: {
      status: ContentStatus.REJECTED,
      rejectionReason: validated.reason,
    },
  });

  return { success: true };
}
