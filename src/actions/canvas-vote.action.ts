"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function voteCanvas(canvasId: number, voteType: "LIKE" | "DISLIKE") {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Get existing vote
    const existingVote = await prisma.canvasVote.findUnique({
      where: {
        userId_canvasId: {
          userId: session.user.id,
          canvasId: canvasId,
        },
      },
    });

    if (existingVote) {
      // Same vote → Remove vote
      if (existingVote.voteType === voteType) {
        await prisma.$transaction([
          prisma.canvasVote.delete({
            where: { id: existingVote.id },
          }),
          prisma.canvas.update({
            where: { id: canvasId },
            data: {
              upvotesCount: {
                decrement: voteType === "LIKE" ? 1 : 0,
              },
              downvotesCount: {
                decrement: voteType === "DISLIKE" ? 1 : 0,
              },
              netScore: {
                decrement: voteType === "LIKE" ? 1 : -1,
              },
            },
          }),
        ]);
      } else {
        // Different vote → Change vote
        await prisma.$transaction([
          prisma.canvasVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          }),
          prisma.canvas.update({
            where: { id: canvasId },
            data: {
              upvotesCount: {
                increment: voteType === "LIKE" ? 1 : -1,
              },
              downvotesCount: {
                increment: voteType === "DISLIKE" ? 1 : -1,
              },
              netScore: {
                increment: voteType === "LIKE" ? 2 : -2,
              },
            },
          }),
        ]);
      }
    } else {
      // New vote
      await prisma.$transaction([
        prisma.canvasVote.create({
          data: {
            userId: session.user.id,
            canvasId: canvasId,
            voteType: voteType,
          },
        }),
        prisma.canvas.update({
          where: { id: canvasId },
          data: {
            upvotesCount: {
              increment: voteType === "LIKE" ? 1 : 0,
            },
            downvotesCount: {
              increment: voteType === "DISLIKE" ? 1 : 0,
            },
            netScore: {
              increment: voteType === "LIKE" ? 1 : -1,
            },
          },
        }),
      ]);
    }

    revalidatePath(`/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]`);

    return { success: true };
  } catch (error) {
    console.error("Error voting canvas:", error);
    throw new Error("Failed to vote");
  }
}

