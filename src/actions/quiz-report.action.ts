"use server";

import { ReportReason } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const ReportQuizSchema = z.object({
  quizId: z.number(),
  reason: z.enum(["SPAM", "INAPPROPRIATE", "WRONG_INFO", "HARASSMENT", "COPYRIGHT", "OTHER"]),
  description: z.string().max(500).optional(),
});

const ReportQuizCommentSchema = z.object({
  commentId: z.number(),
  reason: z.enum(["SPAM", "INAPPROPRIATE", "WRONG_INFO", "HARASSMENT", "COPYRIGHT", "OTHER"]),
  description: z.string().max(500).optional(),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// --- Quiz Report Actions ---

export async function reportQuiz(data: z.infer<typeof ReportQuizSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReportQuizSchema.parse(data);

  // Check if user already reported this quiz
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterUserId: session.user.id,
      reportedQuizId: validated.quizId,
      status: { in: ["PENDING", "RESOLVED"] }, // Don't allow duplicate active reports
    },
  });

  if (existingReport) {
    throw new Error("You have already reported this quiz");
  }

  await prisma.report.create({
    data: {
      reporterUserId: session.user.id,
      reportedQuizId: validated.quizId,
      reason: validated.reason as ReportReason,
      description: validated.description,
    },
  });

  return { success: true };
}

export async function reportQuizComment(data: z.infer<typeof ReportQuizCommentSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReportQuizCommentSchema.parse(data);

  // Check if user already reported this comment
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterUserId: session.user.id,
      reportedQuizCommentId: validated.commentId,
      status: { in: ["PENDING", "RESOLVED"] },
    },
  });

  if (existingReport) {
    throw new Error("You have already reported this comment");
  }

  await prisma.report.create({
    data: {
      reporterUserId: session.user.id,
      reportedQuizCommentId: validated.commentId,
      reason: validated.reason as ReportReason,
      description: validated.description,
    },
  });

  return { success: true };
}
