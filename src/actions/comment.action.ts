"use server";

import { auth } from "@/lib/auth";
import { awardPoints, revokePoints } from "@/lib/points";
import {
  POINT_REASONS,
  POINT_THRESHOLDS,
  POINT_VALUES,
} from "@/lib/points-config";
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
    const comment = await prisma.$transaction(async tx => {
      // Create comment
      const newComment = await tx.comment.create({
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
          canvas: {
            select: {
              chapter: {
                select: {
                  subjectId: true,
                },
              },
            },
          },
        },
      });

      // Award points if comment meets quality threshold (≥20 characters)
      if (trimmedText.length >= POINT_THRESHOLDS.COMMENT_MIN_LENGTH) {
        await awardPoints({
          userId: session.user.id,
          points: POINT_VALUES.COMMENT_CREATED,
          reason: POINT_REASONS.COMMENT_CREATED,
          subjectId: newComment.canvas.chapter.subjectId,
          metadata: { commentId: newComment.id, canvasId },
          tx,
        });
      }

      return newComment;
    });

    revalidatePath(
      "/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]",
      "page"
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
      "/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]",
      "page"
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
      "/subjects/[subjectId]/chapters/[chapterId]/canvases/[canvasId]",
      "page"
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
    // Get comment details (for author and subject)
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, isDeleted: false },
      select: {
        userId: true,
        canvas: {
          select: {
            chapter: {
              select: {
                subjectId: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Prevent self-voting
    if (comment.userId === session.user.id) {
      throw new Error("Cannot vote on your own comment");
    }

    const subjectId = comment.canvas.chapter.subjectId;

    // Get existing vote
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId,
        },
      },
    });

    await prisma.$transaction(async tx => {
      if (existingVote) {
        // Same vote → Remove vote
        if (existingVote.voteType === voteType) {
          await tx.commentVote.delete({
            where: { id: existingVote.id },
          });

          await tx.comment.update({
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
          });

          // Revoke points if removing LIKE vote
          if (voteType === "LIKE") {
            await revokePoints({
              userId: comment.userId,
              points: POINT_VALUES.COMMENT_UPVOTE,
              reason: POINT_REASONS.COMMENT_UPVOTE_REVOKED,
              subjectId,
              metadata: {
                commentId,
                voterId: session.user.id,
              },
              tx,
            });
          }
        } else {
          // Different vote → Change vote
          await tx.commentVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          });

          await tx.comment.update({
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
          });

          // Handle point changes for vote switch
          if (existingVote.voteType === "LIKE" && voteType === "DISLIKE") {
            // Changed from LIKE to DISLIKE → revoke points
            await revokePoints({
              userId: comment.userId,
              points: POINT_VALUES.COMMENT_UPVOTE,
              reason: POINT_REASONS.COMMENT_UPVOTE_REVOKED,
              subjectId,
              metadata: {
                commentId,
                voterId: session.user.id,
              },
              tx,
            });
          } else if (
            existingVote.voteType === "DISLIKE" &&
            voteType === "LIKE"
          ) {
            // Changed from DISLIKE to LIKE → award points
            await awardPoints({
              userId: comment.userId,
              points: POINT_VALUES.COMMENT_UPVOTE,
              reason: POINT_REASONS.COMMENT_UPVOTE_RECEIVED,
              subjectId,
              metadata: {
                commentId,
                voterId: session.user.id,
              },
              tx,
            });
          }
        }
      } else {
        // New vote
        await tx.commentVote.create({
          data: {
            userId: session.user.id,
            commentId: commentId,
            voteType: voteType,
          },
        });

        await tx.comment.update({
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
        });

        // Award points for new LIKE vote (no caps)
        if (voteType === "LIKE") {
          await awardPoints({
            userId: comment.userId,
            points: POINT_VALUES.COMMENT_UPVOTE,
            reason: POINT_REASONS.COMMENT_UPVOTE_RECEIVED,
            subjectId,
            metadata: {
              commentId,
              voterId: session.user.id,
            },
            tx,
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error voting comment:", error);
    throw new Error("Failed to vote");
  }
}
