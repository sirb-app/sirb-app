"use server";

import { auth } from "@/lib/auth";
import { awardPoints } from "@/lib/points";
import { POINT_REASONS, POINT_VALUES } from "@/lib/points-config";
import { prisma } from "@/lib/prisma";
import { checkAnswerCorrectness } from "@/lib/quiz-validation";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const SubmitQuestionAnswerSchema = z.object({
  attemptId: z.number(),
  questionId: z.number(),
  selectedOptionIds: z
    .array(z.number())
    .min(1, "At least one option must be selected"),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// --- Quiz Attempt Actions ---

export async function startQuizAttempt(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Verify quiz exists and is approved
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      status: true,
      isDeleted: true,
      _count: { select: { questions: true } },
    },
  });

  if (!quiz || quiz.isDeleted) {
    throw new Error("Quiz not found");
  }

  if (quiz.status !== "APPROVED") {
    throw new Error("Quiz is not available");
  }

  if (quiz._count.questions === 0) {
    throw new Error("Quiz has no questions");
  }

  // Check for existing incomplete attempt
  const existingAttempt = await prisma.quizAttempt.findFirst({
    where: {
      userId: session.user.id,
      quizId,
      completedAt: null,
    },
    select: { id: true },
  });

  if (existingAttempt) {
    return { success: true, attemptId: existingAttempt.id, isNew: false };
  }

  // Create new attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score: 0,
      totalQuestions: quiz._count.questions,
      percentage: 0,
    },
  });

  return { success: true, attemptId: attempt.id, isNew: true };
}

export async function submitQuestionAnswer(
  data: z.infer<typeof SubmitQuestionAnswerSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = SubmitQuestionAnswerSchema.parse(data);

  // Verify attempt belongs to user and is not completed
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: validated.attemptId },
    select: {
      userId: true,
      completedAt: true,
      quizId: true,
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.completedAt) {
    throw new Error("Quiz attempt already completed");
  }

  // Get question details with correct options
  const question = await prisma.question.findUnique({
    where: { id: validated.questionId },
    include: {
      options: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!question || question.quizId !== attempt.quizId) {
    throw new Error("Question not found or does not belong to this quiz");
  }

  // Get correct option IDs
  const correctOptionIds = question.options
    .filter(o => o.isCorrect)
    .map(o => o.id);

  // Check answer correctness
  const isCorrect = checkAnswerCorrectness(
    validated.selectedOptionIds,
    correctOptionIds,
    question.questionType
  );

  // Check if answer already exists - UI prevents changes but we handle race conditions gracefully
  const existingAnswer = await prisma.questionAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId: validated.attemptId,
        questionId: validated.questionId,
      },
    },
    select: { id: true },
  });

  if (existingAnswer) {
    // Update existing answer (handles race conditions, though UI should prevent this)
    await prisma.$transaction([
      // Delete old selections
      prisma.selectedQuestionOption.deleteMany({
        where: { answerId: existingAnswer.id },
      }),
      // Update answer correctness
      prisma.questionAnswer.update({
        where: { id: existingAnswer.id },
        data: { isCorrect },
      }),
      // Create new selections
      prisma.selectedQuestionOption.createMany({
        data: validated.selectedOptionIds.map(optionId => ({
          answerId: existingAnswer.id,
          optionId,
        })),
      }),
    ]);
  } else {
    // Create new answer
    await prisma.questionAnswer.create({
      data: {
        userId: session.user.id,
        attemptId: validated.attemptId,
        questionId: validated.questionId,
        isCorrect,
        selectedOptions: {
          createMany: {
            data: validated.selectedOptionIds.map(optionId => ({
              optionId,
            })),
          },
        },
      },
    });
  }

  return {
    success: true,
    isCorrect,
    correctOptionIds,
  };
}

export async function completeQuizAttempt(attemptId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Get attempt with answers only (no need to load full quiz with questions)
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      quizId: true,
      totalQuestions: true,
      completedAt: true,
      answers: {
        select: {
          isCorrect: true,
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (attempt.completedAt) {
    throw new Error("Quiz attempt already completed");
  }

  // Calculate score
  const correctCount = attempt.answers.filter(a => a.isCorrect).length;
  const totalQuestions = attempt.totalQuestions;
  const percentage =
    totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // Update attempt and increment quiz attempt count in a single transaction
  await prisma.$transaction(async tx => {
    await tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: correctCount,
        totalQuestions,
        percentage,
        completedAt: new Date(),
      },
    });

    // Get quiz details for contributor and subject
    const quiz = await tx.quiz.findUnique({
      where: { id: attempt.quizId },
      select: {
        contributorId: true,
        chapter: { select: { subjectId: true } },
      },
    });

    if (!quiz) throw new Error("Quiz not found");

    // Increment attempt count on quiz
    await tx.quiz.update({
      where: { id: attempt.quizId },
      data: {
        attemptCount: { increment: 1 },
      },
    });

    // Award points to quiz contributor for completion (no caps)
    await awardPoints({
      userId: quiz.contributorId,
      points: POINT_VALUES.QUIZ_ATTEMPT,
      reason: POINT_REASONS.QUIZ_ATTEMPT_RECEIVED,
      subjectId: quiz.chapter.subjectId,
      metadata: { quizId: attempt.quizId, attemptId, percentage },
      tx,
    });
  });

  return {
    success: true,
    score: correctCount,
    totalQuestions,
    percentage,
  };
}

export async function getQuizAttemptDetails(attemptId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              options: {
                orderBy: { sequence: "asc" },
              },
            },
            orderBy: { sequence: "asc" },
          },
        },
      },
      answers: {
        include: {
          selectedOptions: {
            include: {
              option: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("Attempt not found or unauthorized");
  }

  return attempt;
}

export async function getUserQuizHistory(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      quizId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      score: true,
      totalQuestions: true,
      percentage: true,
      completedAt: true,
    },
  });

  return attempts;
}

export async function getQuizSummary(attemptId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      answers: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { sequence: "asc" },
              },
            },
          },
          selectedOptions: {
            include: {
              option: true,
            },
          },
        },
        orderBy: {
          question: {
            sequence: "asc",
          },
        },
      },
    },
  });

  if (!attempt || attempt.userId !== session.user.id) {
    throw new Error("Attempt not found or unauthorized");
  }

  if (!attempt.completedAt) {
    throw new Error("Quiz attempt not completed yet");
  }

  // Format the summary data
  const summary = {
    attemptId: attempt.id,
    quizId: attempt.quiz.id,
    quizTitle: attempt.quiz.title,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage,
    completedAt: attempt.completedAt,
    questions: attempt.answers.map(answer => ({
      questionId: answer.question.id,
      questionText: answer.question.questionText,
      questionType: answer.question.questionType,
      justification: answer.question.justification,
      options: answer.question.options.map(opt => ({
        id: opt.id,
        text: opt.optionText,
        isCorrect: opt.isCorrect,
      })),
      selectedOptionIds: answer.selectedOptions.map(so => so.optionId),
      isCorrect: answer.isCorrect,
      correctOptionIds: answer.question.options
        .filter(o => o.isCorrect)
        .map(o => o.id),
    })),
  };

  return summary;
}
