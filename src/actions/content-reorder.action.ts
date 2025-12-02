"use server";

import { UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const ReorderCanvasesSchema = z.object({
  chapterId: z.number(),
  updates: z.array(
    z.object({
      canvasId: z.number(),
      sequence: z.number(),
    })
  ),
});

const ReorderQuizzesSchema = z.object({
  chapterId: z.number(),
  updates: z.array(
    z.object({
      quizId: z.number(),
      sequence: z.number(),
    })
  ),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

async function checkModeratorAccess(userId: string, subjectId: number) {
  // Check if user is ADMIN first (faster)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserRole.ADMIN) return true;

  // Check if user is moderator for this subject
  const moderator = await prisma.subjectModerator.findUnique({
    where: {
      userId_subjectId: {
        userId,
        subjectId,
      },
    },
  });

  return !!moderator;
}

// --- Content Reordering Actions ---

export async function reorderCanvases(data: z.infer<typeof ReorderCanvasesSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReorderCanvasesSchema.parse(data);

  // Get subject ID from chapter
  const chapter = await prisma.chapter.findUnique({
    where: { id: validated.chapterId },
    select: { subjectId: true },
  });

  if (!chapter) throw new Error("Chapter not found");

  // Check moderator access
  const hasAccess = await checkModeratorAccess(session.user.id, chapter.subjectId);
  if (!hasAccess) throw new Error("Unauthorized - must be moderator or admin");

  await prisma.$transaction(async tx => {
    // Verify all canvases belong to this chapter before reordering
    const canvasIds = validated.updates.map(u => u.canvasId);
    const canvases = await tx.canvas.findMany({
      where: { id: { in: canvasIds } },
      select: { id: true, chapterId: true },
    });

    if (canvases.length !== canvasIds.length) {
      throw new Error("One or more canvases not found");
    }

    const invalidCanvas = canvases.find(c => c.chapterId !== validated.chapterId);
    if (invalidCanvas) {
      throw new Error("One or more canvases do not belong to this chapter");
    }

    // Two-phase update to avoid unique constraint violations:
    // Phase 1: Move all canvases to temporary negative sequences
    for (let i = 0; i < validated.updates.length; i++) {
      await tx.canvas.update({
        where: { id: validated.updates[i].canvasId },
        data: { sequence: -(i + 1) },
      });
    }

    // Phase 2: Set the final sequences
    for (const update of validated.updates) {
      await tx.canvas.update({
        where: { id: update.canvasId },
        data: { sequence: update.sequence },
      });
    }
  });

  return { success: true };
}

export async function reorderQuizzes(data: z.infer<typeof ReorderQuizzesSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReorderQuizzesSchema.parse(data);

  // Get subject ID from chapter
  const chapter = await prisma.chapter.findUnique({
    where: { id: validated.chapterId },
    select: { subjectId: true },
  });

  if (!chapter) throw new Error("Chapter not found");

  // Check moderator access
  const hasAccess = await checkModeratorAccess(session.user.id, chapter.subjectId);
  if (!hasAccess) throw new Error("Unauthorized - must be moderator or admin");

  await prisma.$transaction(async tx => {
    // Verify all quizzes belong to this chapter before reordering
    const quizIds = validated.updates.map(u => u.quizId);
    const quizzes = await tx.quiz.findMany({
      where: { id: { in: quizIds } },
      select: { id: true, chapterId: true },
    });

    if (quizzes.length !== quizIds.length) {
      throw new Error("One or more quizzes not found");
    }

    const invalidQuiz = quizzes.find(q => q.chapterId !== validated.chapterId);
    if (invalidQuiz) {
      throw new Error("One or more quizzes do not belong to this chapter");
    }

    // Two-phase update to avoid unique constraint violations:
    // Phase 1: Move all quizzes to temporary negative sequences
    for (let i = 0; i < validated.updates.length; i++) {
      await tx.quiz.update({
        where: { id: validated.updates[i].quizId },
        data: { sequence: -(i + 1) },
      });
    }

    // Phase 2: Set the final sequences
    for (const update of validated.updates) {
      await tx.quiz.update({
        where: { id: update.quizId },
        data: { sequence: update.sequence },
      });
    }
  });

  return { success: true };
}
