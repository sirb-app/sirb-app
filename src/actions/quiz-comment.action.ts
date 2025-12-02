"use server";

import { VoteType } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const CreateQuizCommentSchema = z.object({
  quizId: z.number(),
  text: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
  parentCommentId: z.number().optional(),
});

const UpdateQuizCommentSchema = z.object({
  commentId: z.number(),
  text: z.string().min(1).max(2000),
});

const ToggleQuizCommentVoteSchema = z.object({
  commentId: z.number(),
  voteType: z.enum(["LIKE", "DISLIKE"]),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// --- Quiz Comment Actions ---

export async function createQuizComment(data: z.infer<typeof CreateQuizCommentSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = CreateQuizCommentSchema.parse(data);

  const comment = await prisma.quizComment.create({
    data: {
      text: validated.text,
      userId: session.user.id,
      quizId: validated.quizId,
      parentCommentId: validated.parentCommentId,
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

  return { success: true, comment };
}

export async function updateQuizComment(data: z.infer<typeof UpdateQuizCommentSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateQuizCommentSchema.parse(data);

  // Verify comment belongs to user
  const comment = await prisma.quizComment.findUnique({
    where: { id: validated.commentId },
    select: { userId: true },
  });

  if (!comment || comment.userId !== session.user.id) {
    throw new Error("Comment not found or unauthorized");
  }

  await prisma.quizComment.update({
    where: { id: validated.commentId },
    data: {
      text: validated.text,
      editedAt: new Date(),
    },
  });

  return { success: true };
}

export async function deleteQuizComment(commentId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Verify comment belongs to user
  const comment = await prisma.quizComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment || comment.userId !== session.user.id) {
    throw new Error("Comment not found or unauthorized");
  }

  // Soft delete
  await prisma.quizComment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });

  return { success: true };
}

export async function toggleQuizCommentVote(data: z.infer<typeof ToggleQuizCommentVoteSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ToggleQuizCommentVoteSchema.parse(data);

  await prisma.$transaction(async tx => {
    // Check for existing vote
    const existingVote = await tx.quizCommentVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: validated.commentId,
        },
      },
    });

    const comment = await tx.quizComment.findUnique({
      where: { id: validated.commentId },
      select: {
        upvotesCount: true,
        downvotesCount: true,
      },
    });

    if (!comment) throw new Error("Comment not found");

    let upvotesDelta = 0;
    let downvotesDelta = 0;

    if (existingVote) {
      if (existingVote.voteType === validated.voteType) {
        // Remove vote (toggle off)
        await tx.quizCommentVote.delete({
          where: { id: existingVote.id },
        });

        if (validated.voteType === VoteType.LIKE) {
          upvotesDelta = -1;
        } else {
          downvotesDelta = -1;
        }
      } else {
        // Change vote type
        await tx.quizCommentVote.update({
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
      await tx.quizCommentVote.create({
        data: {
          userId: session.user.id,
          commentId: validated.commentId,
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
    const newUpvotes = comment.upvotesCount + upvotesDelta;
    const newDownvotes = comment.downvotesCount + downvotesDelta;

    await tx.quizComment.update({
      where: { id: validated.commentId },
      data: {
        upvotesCount: newUpvotes,
        downvotesCount: newDownvotes,
        netScore: newUpvotes - newDownvotes,
      },
    });
  });

  return { success: true };
}

export async function getQuizComments(quizId: number) {
  const comments = await prisma.quizComment.findMany({
    where: {
      quizId,
      parentCommentId: null,
      isDeleted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        where: { isDeleted: false },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { netScore: "desc" },
  });

  return comments;
}
