"use server";

import { ContentStatus, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { notifyModeratorsOfSubmission } from "@/lib/email/email-service";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const CreateQuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  chapterId: z.number(),
});

const UpdateQuizSchema = z.object({
  quizId: z.number(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

async function checkQuizOwnership(quizId: number, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      contributorId: true,
      status: true,
      isDeleted: true,
      chapter: { select: { subjectId: true } },
    },
  });

  if (!quiz || quiz.isDeleted) throw new Error("Quiz not found");

  if (quiz.contributorId === userId) return quiz;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserRole.ADMIN) return quiz;

  throw new Error("Unauthorized");
}

// --- Quiz Actions ---

export async function createQuiz(data: z.infer<typeof CreateQuizSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = CreateQuizSchema.parse(data);

  // Get next sequence (exclude soft-deleted quizzes)
  const lastQuiz = await prisma.quiz.findFirst({
    where: {
      chapterId: validated.chapterId,
      isDeleted: false,
    },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const sequence = (lastQuiz?.sequence ?? 0) + 1;

  const quiz = await prisma.quiz.create({
    data: {
      title: validated.title,
      description: validated.description,
      chapterId: validated.chapterId,
      contributorId: session.user.id,
      sequence,
      // status defaults to DRAFT in schema
    },
  });

  return { success: true, quizId: quiz.id };
}

export async function updateQuiz(data: z.infer<typeof UpdateQuizSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateQuizSchema.parse(data);
  await checkQuizOwnership(validated.quizId, session.user.id);

  await prisma.quiz.update({
    where: { id: validated.quizId },
    data: {
      title: validated.title,
      description: validated.description,
    },
  });

  return { success: true };
}

export async function deleteQuiz(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const quiz = await checkQuizOwnership(quizId, session.user.id);

  if (quiz.status === ContentStatus.APPROVED) {
    // Soft delete
    await prisma.quiz.update({
      where: { id: quizId },
      data: { isDeleted: true },
    });
  } else {
    // Hard delete
    await prisma.quiz.delete({
      where: { id: quizId },
    });
  }

  return { success: true };
}

export async function submitQuiz(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const quiz = await checkQuizOwnership(quizId, session.user.id);

  if (
    quiz.status !== ContentStatus.DRAFT &&
    quiz.status !== ContentStatus.REJECTED
  ) {
    throw new Error("Quiz cannot be submitted in current status");
  }

  // Check if quiz has at least one question
  const questionCount = await prisma.question.count({
    where: { quizId },
  });

  if (questionCount === 0) {
    throw new Error("Quiz must have at least one question before submission");
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: ContentStatus.PENDING },
  });

  // Notify moderators of the new submission (fire and forget)
  const quizData = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      contributor: { select: { name: true } },
      chapter: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (quizData) {
    notifyModeratorsOfSubmission({
      subjectId: quizData.chapter.subject.id,
      subjectName: quizData.chapter.subject.name,
      contentType: "QUIZ",
      contentId: quizData.id,
      contentTitle: quizData.title,
      contributorName: quizData.contributor.name,
      chapterTitle: quizData.chapter.title,
    }).catch(err => console.error("[Email] Failed to notify moderators:", err));
  }

  return { success: true };
}

export async function cancelSubmission(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const quiz = await checkQuizOwnership(quizId, session.user.id);

  if (quiz.status !== ContentStatus.PENDING) {
    throw new Error("Quiz is not pending review");
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: { status: ContentStatus.DRAFT },
  });

  return { success: true };
}
