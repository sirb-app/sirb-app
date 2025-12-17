"use server";

import { VoteType } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { awardPoints, revokePoints } from "@/lib/points";
import { POINT_REASONS, POINT_VALUES } from "@/lib/points-config";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const ToggleQuizVoteSchema = z.object({
  quizId: z.number(),
  voteType: z.enum(["LIKE", "DISLIKE"]),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// --- Quiz Vote Actions ---

export async function toggleQuizVote(
  data: z.infer<typeof ToggleQuizVoteSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ToggleQuizVoteSchema.parse(data);

  await prisma.$transaction(async tx => {
    // Get quiz details (for contributor and subject)
    const quiz = await tx.quiz.findUnique({
      where: { id: validated.quizId },
      select: {
        contributorId: true,
        upvotesCount: true,
        downvotesCount: true,
        chapter: { select: { subjectId: true } },
      },
    });

    if (!quiz) throw new Error("Quiz not found");

    // Prevent self-voting
    if (quiz.contributorId === session.user.id) {
      throw new Error("Cannot vote on your own content");
    }

    const subjectId = quiz.chapter.subjectId;

    // Check for existing vote
    const existingVote = await tx.quizVote.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: validated.quizId,
        },
      },
    });

    let upvotesDelta = 0;
    let downvotesDelta = 0;

    if (existingVote) {
      if (existingVote.voteType === validated.voteType) {
        // Remove vote (toggle off)
        await tx.quizVote.delete({
          where: { id: existingVote.id },
        });

        if (validated.voteType === VoteType.LIKE) {
          upvotesDelta = -1;
          // Revoke points for removed LIKE
          await revokePoints({
            userId: quiz.contributorId,
            points: POINT_VALUES.QUIZ_UPVOTE,
            reason: POINT_REASONS.QUIZ_UPVOTE_REVOKED,
            subjectId,
            metadata: { quizId: validated.quizId, voterId: session.user.id },
            tx,
          });
        } else {
          downvotesDelta = -1;
        }
      } else {
        // Change vote type
        await tx.quizVote.update({
          where: { id: existingVote.id },
          data: { voteType: validated.voteType as VoteType },
        });

        if (validated.voteType === VoteType.LIKE) {
          upvotesDelta = 1;
          downvotesDelta = -1;
          // Changed from DISLIKE to LIKE → award points
          await awardPoints({
            userId: quiz.contributorId,
            points: POINT_VALUES.QUIZ_UPVOTE,
            reason: POINT_REASONS.QUIZ_UPVOTE_RECEIVED,
            subjectId,
            metadata: { quizId: validated.quizId, voterId: session.user.id },
            tx,
          });
        } else {
          upvotesDelta = -1;
          downvotesDelta = 1;
          // Changed from LIKE to DISLIKE → revoke points
          await revokePoints({
            userId: quiz.contributorId,
            points: POINT_VALUES.QUIZ_UPVOTE,
            reason: POINT_REASONS.QUIZ_UPVOTE_REVOKED,
            subjectId,
            metadata: { quizId: validated.quizId, voterId: session.user.id },
            tx,
          });
        }
      }
    } else {
      // Create new vote
      await tx.quizVote.create({
        data: {
          userId: session.user.id,
          quizId: validated.quizId,
          voteType: validated.voteType as VoteType,
        },
      });

      if (validated.voteType === VoteType.LIKE) {
        upvotesDelta = 1;
        // Award points for new LIKE
        await awardPoints({
          userId: quiz.contributorId,
          points: POINT_VALUES.QUIZ_UPVOTE,
          reason: POINT_REASONS.QUIZ_UPVOTE_RECEIVED,
          subjectId,
          metadata: { quizId: validated.quizId, voterId: session.user.id },
          tx,
        });
      } else {
        downvotesDelta = 1;
      }
    }

    // Update denormalized counts
    const newUpvotes = quiz.upvotesCount + upvotesDelta;
    const newDownvotes = quiz.downvotesCount + downvotesDelta;

    await tx.quiz.update({
      where: { id: validated.quizId },
      data: {
        upvotesCount: newUpvotes,
        downvotesCount: newDownvotes,
        netScore: newUpvotes - newDownvotes,
      },
    });
  });

  return { success: true };
}

export async function getUserQuizVote(quizId: number) {
  const session = await getSession();
  if (!session) return null;

  const vote = await prisma.quizVote.findUnique({
    where: {
      userId_quizId: {
        userId: session.user.id,
        quizId,
      },
    },
    select: { voteType: true },
  });

  return vote?.voteType ?? null;
}
