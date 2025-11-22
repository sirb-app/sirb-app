"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function addComment(
  canvasId: number,
  text: string,
  parentCommentId?: number
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0 || trimmedText.length > 2000) {
    throw new Error("Invalid comment length");
  }

  await checkRateLimit(session.user.id, "comment");

  try {
    const comment = await prisma.comment.create({
      data: {
        text: trimmedText,
        userId: session.user.id,
        canvasId: canvasId,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    revalidatePath(
      `/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]`
    );

    return { success: true, comment };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw new Error("Failed to add comment");
  }
}

export async function editComment(commentId: number, text: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0 || trimmedText.length > 2000) {
    throw new Error("Invalid comment length");
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment || comment.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        text: trimmedText,
        editedAt: new Date(),
      },
    });

    revalidatePath(
      `/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]`
    );

    return { success: true };
  } catch (error) {
    console.error("Error editing comment:", error);
    throw new Error("Failed to edit comment");
  }
}

export async function deleteComment(commentId: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Verify ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment || comment.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    // Soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    revalidatePath(
      `/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]`
    );

    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Failed to delete comment");
  }
}

export async function voteComment(
  commentId: number,
  voteType: "LIKE" | "DISLIKE"
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Get existing vote
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId,
        },
      },
    });

    if (existingVote) {
      // Same vote → Remove vote
      if (existingVote.voteType === voteType) {
        await prisma.$transaction([
          prisma.commentVote.delete({
            where: { id: existingVote.id },
          }),
          prisma.comment.update({
            where: { id: commentId },
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
          prisma.commentVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          }),
          prisma.comment.update({
            where: { id: commentId },
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
        prisma.commentVote.create({
          data: {
            userId: session.user.id,
            commentId: commentId,
            voteType: voteType,
          },
        }),
        prisma.comment.update({
          where: { id: commentId },
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

    revalidatePath(
      `/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]`
    );

    return { success: true };
  } catch (error) {
    console.error("Error voting comment:", error);
    throw new Error("Failed to vote");
  }
}
