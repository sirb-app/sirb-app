"use server";

import { auth } from "@/lib/auth";
import { awardPoints, revokePoints } from "@/lib/points";
import { POINT_REASONS, POINT_VALUES } from "@/lib/points-config";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function voteCanvas(
  canvasId: number,
  voteType: "LIKE" | "DISLIKE"
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    // Get canvas details (for subject and contributor)
    const canvas = await prisma.canvas.findUnique({
      where: { id: canvasId },
      select: {
        contributorId: true,
        chapter: { select: { subjectId: true } },
      },
    });

    if (!canvas) throw new Error("Canvas not found");

    // Prevent self-voting
    if (canvas.contributorId === session.user.id) {
      throw new Error("Cannot vote on your own content");
    }

    const subjectId = canvas.chapter.subjectId;

    // Get existing vote
    const existingVote = await prisma.canvasVote.findUnique({
      where: {
        userId_canvasId: {
          userId: session.user.id,
          canvasId: canvasId,
        },
      },
    });

    await prisma.$transaction(async tx => {
      if (existingVote) {
        // Same vote → Remove vote
        if (existingVote.voteType === voteType) {
          await tx.canvasVote.delete({
            where: { id: existingVote.id },
          });

          await tx.canvas.update({
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
          });

          // Revoke points if removing LIKE vote
          if (voteType === "LIKE") {
            await revokePoints({
              userId: canvas.contributorId,
              points: POINT_VALUES.CANVAS_UPVOTE,
              reason: POINT_REASONS.CANVAS_UPVOTE_REVOKED,
              subjectId,
              metadata: { canvasId, voterId: session.user.id },
              tx,
            });
          }
        } else {
          // Different vote → Change vote
          await tx.canvasVote.update({
            where: { id: existingVote.id },
            data: { voteType },
          });

          await tx.canvas.update({
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
          });

          // Handle point changes for vote switch
          if (existingVote.voteType === "LIKE" && voteType === "DISLIKE") {
            // Changed from LIKE to DISLIKE → revoke points
            await revokePoints({
              userId: canvas.contributorId,
              points: POINT_VALUES.CANVAS_UPVOTE,
              reason: POINT_REASONS.CANVAS_UPVOTE_REVOKED,
              subjectId,
              metadata: { canvasId, voterId: session.user.id },
              tx,
            });
          } else if (
            existingVote.voteType === "DISLIKE" &&
            voteType === "LIKE"
          ) {
            // Changed from DISLIKE to LIKE → award points
            await awardPoints({
              userId: canvas.contributorId,
              points: POINT_VALUES.CANVAS_UPVOTE,
              reason: POINT_REASONS.CANVAS_UPVOTE_RECEIVED,
              subjectId,
              metadata: { canvasId, voterId: session.user.id },
              tx,
            });
          }
        }
      } else {
        // New vote
        await tx.canvasVote.create({
          data: {
            userId: session.user.id,
            canvasId: canvasId,
            voteType: voteType,
          },
        });

        await tx.canvas.update({
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
        });

        // Award points for new LIKE vote (no caps)
        if (voteType === "LIKE") {
          await awardPoints({
            userId: canvas.contributorId,
            points: POINT_VALUES.CANVAS_UPVOTE,
            reason: POINT_REASONS.CANVAS_UPVOTE_RECEIVED,
            subjectId,
            metadata: { canvasId, voterId: session.user.id },
            tx,
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error voting canvas:", error);
    throw new Error("Failed to vote");
  }
}
