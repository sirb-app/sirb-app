"use server";

import { QuestionType, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const AddQuestionSchema = z.object({
  quizId: z.number(),
  questionText: z.string().min(5, "Question must be at least 5 characters"),
  questionType: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"]),
  justification: z.string().optional(),
  options: z.array(z.object({
    optionText: z.string().min(1, "Option text cannot be empty"),
    isCorrect: z.boolean(),
  })).min(2, "At least 2 options required"),
}).refine(data => {
  const correctCount = data.options.filter(o => o.isCorrect).length;

  if (data.questionType === "MCQ_SINGLE" || data.questionType === "TRUE_FALSE") {
    return correctCount === 1;
  }
  return correctCount >= 1; // MCQ_MULTI
}, {
  message: "Invalid correct answer configuration for question type"
});

const UpdateQuestionSchema = z.object({
  questionId: z.number(),
  quizId: z.number(),
  questionText: z.string().min(5).optional(),
  questionType: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE"]).optional(),
  justification: z.string().optional(),
  options: z.array(z.object({
    optionText: z.string().min(1),
    isCorrect: z.boolean(),
  })).min(2).optional(),
});

const ReorderQuestionsSchema = z.object({
  quizId: z.number(),
  updates: z.array(
    z.object({
      questionId: z.number(),
      sequence: z.number(),
    })
  ),
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

async function getNextQuestionSequence(
  quizId: number,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const lastQuestion = await tx.question.findFirst({
    where: { quizId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return (lastQuestion?.sequence ?? 0) + 1;
}

// --- Question Actions ---

export async function addQuestion(data: z.infer<typeof AddQuestionSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = AddQuestionSchema.parse(data);
  await checkQuizOwnership(validated.quizId, session.user.id);

  return await prisma.$transaction(async tx => {
    // Get sequence INSIDE transaction for proper isolation
    const sequence = await getNextQuestionSequence(validated.quizId, tx);

    // Special handling for TRUE_FALSE questions
    let options = validated.options;
    if (validated.questionType === "TRUE_FALSE") {
      // Auto-create True/False options in Arabic
      const correctAnswerIndex = validated.options.findIndex(o => o.isCorrect);
      options = [
        { optionText: "صح", isCorrect: correctAnswerIndex === 0 },
        { optionText: "خطأ", isCorrect: correctAnswerIndex === 1 },
      ];
    }

    // Create Question
    const question = await tx.question.create({
      data: {
        questionText: validated.questionText,
        questionType: validated.questionType as QuestionType,
        justification: validated.justification,
        sequence,
        quizId: validated.quizId,
      },
    });

    // Create Options (batch operation for better performance)
    await tx.questionOption.createMany({
      data: options.map((option, index) => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        sequence: index + 1,
        questionId: question.id,
      })),
    });

    return { success: true, questionId: question.id };
  });
}

export async function updateQuestion(data: z.infer<typeof UpdateQuestionSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateQuestionSchema.parse(data);
  await checkQuizOwnership(validated.quizId, session.user.id);

  return await prisma.$transaction(async tx => {
    // Verify question belongs to quiz
    const question = await tx.question.findUnique({
      where: { id: validated.questionId },
      select: { quizId: true, questionType: true },
    });

    if (!question || question.quizId !== validated.quizId) {
      throw new Error("Question not found or does not belong to this quiz");
    }

    // Update question text and justification
    await tx.question.update({
      where: { id: validated.questionId },
      data: {
        questionText: validated.questionText,
        justification: validated.justification,
      },
    });

    // If options provided, replace all options
    if (validated.options) {
      // Delete existing options
      await tx.questionOption.deleteMany({
        where: { questionId: validated.questionId },
      });

      // Special handling for TRUE_FALSE questions
      let options = validated.options;
      if (validated.questionType === "TRUE_FALSE" || question.questionType === "TRUE_FALSE") {
        const correctAnswerIndex = options.findIndex(o => o.isCorrect);
        options = [
          { optionText: "صح", isCorrect: correctAnswerIndex === 0 },
          { optionText: "خطأ", isCorrect: correctAnswerIndex === 1 },
        ];
      }

      // Create new options (batch operation for better performance)
      await tx.questionOption.createMany({
        data: options.map((option, index) => ({
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          sequence: index + 1,
          questionId: validated.questionId,
        })),
      });
    }

    return { success: true };
  });
}

export async function deleteQuestion(questionId: number, quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await checkQuizOwnership(quizId, session.user.id);

  await prisma.$transaction(async tx => {
    const question = await tx.question.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });

    if (!question || question.quizId !== quizId) {
      throw new Error("Question not found or does not belong to this quiz");
    }

    // Delete Question (this will CASCADE delete options and answers)
    await tx.question.delete({ where: { id: questionId } });

    // Resequence remaining questions
    const remainingQuestions = await tx.question.findMany({
      where: { quizId },
      orderBy: { sequence: "asc" },
    });

    for (let i = 0; i < remainingQuestions.length; i++) {
      if (remainingQuestions[i].sequence !== i + 1) {
        await tx.question.update({
          where: { id: remainingQuestions[i].id },
          data: { sequence: i + 1 },
        });
      }
    }
  });

  return { success: true };
}

export async function reorderQuestions(data: z.infer<typeof ReorderQuestionsSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReorderQuestionsSchema.parse(data);
  await checkQuizOwnership(validated.quizId, session.user.id);

  await prisma.$transaction(async tx => {
    // Verify all questions belong to this quiz before reordering
    const questionIds = validated.updates.map(u => u.questionId);
    const questions = await tx.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, quizId: true },
    });

    if (questions.length !== questionIds.length) {
      throw new Error("One or more questions not found");
    }

    const invalidQuestion = questions.find(q => q.quizId !== validated.quizId);
    if (invalidQuestion) {
      throw new Error("One or more questions do not belong to this quiz");
    }

    // Two-phase update to avoid unique constraint violations:
    // Phase 1: Move all questions to temporary negative sequences
    for (let i = 0; i < validated.updates.length; i++) {
      await tx.question.update({
        where: { id: validated.updates[i].questionId },
        data: { sequence: -(i + 1) }, // Use negative sequences temporarily
      });
    }

    // Phase 2: Set the final sequences
    for (const update of validated.updates) {
      await tx.question.update({
        where: { id: update.questionId },
        data: { sequence: update.sequence },
      });
    }
  });

  return { success: true };
}
