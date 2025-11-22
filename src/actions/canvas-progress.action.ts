"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function markCanvasComplete(canvasId: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return;
  }

  try {
    await prisma.canvasProgress.upsert({
      where: {
        userId_canvasId: {
          userId: session.user.id,
          canvasId: canvasId,
        },
      },
      create: {
        userId: session.user.id,
        canvasId: canvasId,
        completedAt: new Date(),
        lastAccessed: new Date(),
      },
      update: {
        completedAt: new Date(),
        lastAccessed: new Date(),
      },
    });
  } catch (error) {
    console.error("Error marking canvas complete:", error);
  }
}

export async function toggleCanvasCompletion(
  canvasId: number,
  completed: boolean
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.canvasProgress.upsert({
      where: {
        userId_canvasId: {
          userId: session.user.id,
          canvasId: canvasId,
        },
      },
      create: {
        userId: session.user.id,
        canvasId: canvasId,
        completedAt: completed ? new Date() : null,
        lastAccessed: new Date(),
      },
      update: {
        completedAt: completed ? new Date() : null,
        lastAccessed: new Date(),
      },
    });

    // Revalidate the chapter page to show updated status
    revalidatePath("/subjects/[subjectId]/chapters/[chapterId]");

    return { success: true };
  } catch (error) {
    console.error("Error toggling canvas completion:", error);
    throw new Error("Failed to update completion status");
  }
}
