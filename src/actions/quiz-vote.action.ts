"use server";

import { VoteType } from "@/generated/prisma";
import { auth } from "@/lib/auth";
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

export async function toggleQuizVote(data: z.infer<typeof ToggleQuizVoteSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ToggleQuizVoteSchema.parse(data);

  await prisma.$transaction(async tx => {
    // Check for existing vote
    const existingVote = await tx.quizVote.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: validated.quizId,
        },
      },
    });

    const quiz = await tx.quiz.findUnique({
      where: { id: validated.quizId },
      select: {
        upvotesCount: true,
        downvotesCount: true,
      },
    });

    if (!quiz) throw new Error("Quiz not found");

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
        } else {
          upvotesDelta = -1;
          downvotesDelta = 1;
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
