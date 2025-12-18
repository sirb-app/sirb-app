"use server";

import { ContentStatus, ReportStatus, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import {
  notifyContributorOfDecision,
  notifyReporterOfResolution,
} from "@/lib/email/email-service";
import { awardPoints } from "@/lib/points";
import { POINT_REASONS, POINT_VALUES } from "@/lib/points-config";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const RejectCanvasSchema = z.object({
  canvasId: z.number(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

const RejectQuizSchema = z.object({
  quizId: z.number(),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

const ResolveReportSchema = z.object({
  reportId: z.number(),
  resolution: z.enum(["RESOLVED", "DISMISSED"]),
  notes: z.string().max(500).optional(),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

async function checkModeratorAccess(userId: string, subjectId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserRole.ADMIN) return true;

  const moderator = await prisma.subjectModerator.findUnique({
    where: {
      userId_subjectId: {
        userId,
        subjectId,
      },
    },
  });

  if (!moderator)
    throw new Error("Unauthorized: You are not a moderator for this subject");
  return true;
}

async function getCanvasWithSubject(canvasId: number) {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: {
      id: true,
      status: true,
      isDeleted: true,
      chapter: {
        select: {
          subjectId: true,
        },
      },
    },
  });

  if (!canvas || canvas.isDeleted) throw new Error("Canvas not found");
  return canvas;
}

async function getQuizWithSubject(quizId: number) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      status: true,
      isDeleted: true,
      chapter: {
        select: {
          subjectId: true,
        },
      },
    },
  });

  if (!quiz || quiz.isDeleted) throw new Error("Quiz not found");
  return quiz;
}

// --- Actions ---

export async function getModerationQueue(subjectId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await checkModeratorAccess(session.user.id, subjectId);

  const pendingCanvases = await prisma.canvas.findMany({
    where: {
      chapter: { subjectId },
      status: ContentStatus.PENDING,
      isDeleted: false, // Exclude soft-deleted canvases
    },
    include: {
      contributor: {
        select: {
          name: true,
          image: true,
        },
      },
      chapter: {
        select: {
          id: true,
          title: true,
          subjectId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const pendingQuizzes = await prisma.quiz.findMany({
    where: {
      chapter: { subjectId },
      status: ContentStatus.PENDING,
      isDeleted: false,
    },
    include: {
      contributor: {
        select: {
          name: true,
          image: true,
        },
      },
      chapter: {
        select: {
          id: true,
          title: true,
          subjectId: true,
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const reports = await prisma.report.findMany({
    where: {
      OR: [
        { reportedCanvas: { chapter: { subjectId }, isDeleted: false } },
        {
          reportedComment: {
            canvas: { chapter: { subjectId }, isDeleted: false },
          },
        },
        { reportedQuiz: { chapter: { subjectId }, isDeleted: false } },
        {
          reportedQuizComment: {
            quiz: { chapter: { subjectId }, isDeleted: false },
          },
        },
      ],
      status: "PENDING",
    },
    include: {
      reporter: {
        select: { name: true },
      },
      reportedCanvas: {
        select: {
          id: true,
          title: true,
          chapterId: true,
          chapter: { select: { subjectId: true } },
        },
      },
      reportedComment: {
        select: {
          id: true,
          text: true,
          canvasId: true,
          canvas: {
            select: {
              id: true,
              chapterId: true,
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
      reportedQuiz: {
        select: {
          id: true,
          title: true,
          chapterId: true,
          chapter: { select: { subjectId: true } },
        },
      },
      reportedQuizComment: {
        select: {
          id: true,
          text: true,
          quizId: true,
          quiz: {
            select: {
              id: true,
              chapterId: true,
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { pendingCanvases, pendingQuizzes, reports };
}

export async function approveCanvas(canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const canvas = await getCanvasWithSubject(canvasId);
  await checkModeratorAccess(session.user.id, canvas.chapter.subjectId);

  // Use transaction to ensure atomicity of approval + point awards
  await prisma.$transaction(async tx => {
    // Atomically update canvas status - only if still PENDING
    // This prevents race conditions where two moderators approve simultaneously
    const updateResult = await tx.canvas.updateMany({
      where: {
        id: canvasId,
        status: ContentStatus.PENDING, // Atomic check
      },
      data: {
        status: ContentStatus.APPROVED,
        rejectionReason: null,
      },
    });

    // If no rows updated, canvas was already processed
    if (updateResult.count === 0) {
      throw new Error("Canvas has already been processed");
    }

    // Get full canvas details including contributor and content blocks
    const fullCanvas = await tx.canvas.findUnique({
      where: { id: canvasId },
      select: {
        contributorId: true,
        chapter: { select: { subjectId: true } },
        contentBlocks: {
          select: {
            id: true,
            contentType: true,
            video: { select: { isOriginal: true } },
            file: { select: { isOriginal: true } },
          },
        },
      },
    });

    if (!fullCanvas) throw new Error("Canvas not found");

    const subjectId = fullCanvas.chapter.subjectId;

    // Award canvas approval points to contributor
    await awardPoints({
      userId: fullCanvas.contributorId,
      points: POINT_VALUES.CANVAS_APPROVED,
      reason: POINT_REASONS.CANVAS_APPROVED,
      subjectId,
      metadata: { canvasId },
      tx,
    });

    // Award content block bonuses
    for (const block of fullCanvas.contentBlocks) {
      // Skip points for external VIDEO/FILE content (only award for original content)
      if (block.contentType === "VIDEO" && !block.video?.isOriginal) continue;
      if (block.contentType === "FILE" && !block.file?.isOriginal) continue;

      const blockPoints =
        POINT_VALUES.CONTENT_BLOCKS[
          block.contentType as keyof typeof POINT_VALUES.CONTENT_BLOCKS
        ] || 0;

      if (blockPoints > 0) {
        await awardPoints({
          userId: fullCanvas.contributorId,
          points: blockPoints,
          reason: POINT_REASONS.CONTENT_BLOCK_ADDED,
          subjectId,
          metadata: {
            canvasId,
            contentBlockId: block.id,
            contentType: block.contentType,
          },
          tx,
        });
      }
    }

    // Award moderator action points
    await awardPoints({
      userId: session.user.id,
      points: POINT_VALUES.MODERATOR_APPROVAL,
      reason: POINT_REASONS.CONTENT_APPROVED_BY_MODERATOR,
      subjectId,
      metadata: { canvasId, moderatorAction: true },
      tx,
    });
  });

  // Notify contributor of approval (fire and forget)
  const canvasData = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      contributor: { select: { email: true, name: true } },
      chapter: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (canvasData) {
    notifyContributorOfDecision({
      recipientEmail: canvasData.contributor.email,
      recipientName: canvasData.contributor.name,
      contentType: "CANVAS",
      contentId: canvasData.id,
      contentTitle: canvasData.title,
      subjectId: canvasData.chapter.subject.id,
      subjectName: canvasData.chapter.subject.name,
      chapterTitle: canvasData.chapter.title,
      chapterId: canvasData.chapterId,
      decision: "APPROVED",
    }).catch(err =>
      console.error("[Email] Failed to notify contributor:", err)
    );
  }

  return { success: true };
}

export async function rejectCanvas(data: z.infer<typeof RejectCanvasSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = RejectCanvasSchema.parse(data);
  const canvas = await getCanvasWithSubject(validated.canvasId);
  const subjectId = canvas.chapter.subjectId;
  await checkModeratorAccess(session.user.id, subjectId);

  await prisma.$transaction(async tx => {
    // Atomically update canvas status - only if still PENDING
    const updateResult = await tx.canvas.updateMany({
      where: {
        id: validated.canvasId,
        status: ContentStatus.PENDING, // Atomic check
      },
      data: {
        status: ContentStatus.REJECTED,
        rejectionReason: validated.reason,
      },
    });

    // If no rows updated, canvas was already processed
    if (updateResult.count === 0) {
      throw new Error("Canvas has already been processed");
    }

    // Award moderator points for reviewing content
    await awardPoints({
      userId: session.user.id,
      points: POINT_VALUES.MODERATOR_REJECTION,
      reason: POINT_REASONS.CONTENT_REJECTED_BY_MODERATOR,
      subjectId,
      metadata: { canvasId: validated.canvasId, moderatorAction: true },
      tx,
    });
  });

  // Notify contributor of rejection (fire and forget)
  const canvasData = await prisma.canvas.findUnique({
    where: { id: validated.canvasId },
    include: {
      contributor: { select: { email: true, name: true } },
      chapter: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (canvasData) {
    notifyContributorOfDecision({
      recipientEmail: canvasData.contributor.email,
      recipientName: canvasData.contributor.name,
      contentType: "CANVAS",
      contentId: canvasData.id,
      contentTitle: canvasData.title,
      subjectId: canvasData.chapter.subject.id,
      subjectName: canvasData.chapter.subject.name,
      chapterTitle: canvasData.chapter.title,
      chapterId: canvasData.chapterId,
      decision: "REJECTED",
      rejectionReason: validated.reason,
    }).catch(err =>
      console.error("[Email] Failed to notify contributor:", err)
    );
  }

  return { success: true };
}

export async function approveQuiz(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const quiz = await getQuizWithSubject(quizId);
  await checkModeratorAccess(session.user.id, quiz.chapter.subjectId);

  // Use transaction to ensure atomicity of approval + point awards
  await prisma.$transaction(async tx => {
    // Atomically update quiz status - only if still PENDING
    // This prevents race conditions where two moderators approve simultaneously
    const updateResult = await tx.quiz.updateMany({
      where: {
        id: quizId,
        status: ContentStatus.PENDING, // Atomic check
      },
      data: {
        status: ContentStatus.APPROVED,
        rejectionReason: null,
      },
    });

    // If no rows updated, quiz was already processed
    if (updateResult.count === 0) {
      throw new Error("Quiz has already been processed");
    }

    // Get full quiz details including contributor and questions
    const fullQuiz = await tx.quiz.findUnique({
      where: { id: quizId },
      select: {
        contributorId: true,
        chapter: { select: { subjectId: true } },
        questions: { select: { id: true } },
      },
    });

    if (!fullQuiz) throw new Error("Quiz not found");

    const subjectId = fullQuiz.chapter.subjectId;

    // Award quiz approval points to contributor
    await awardPoints({
      userId: fullQuiz.contributorId,
      points: POINT_VALUES.QUIZ_APPROVED,
      reason: POINT_REASONS.QUIZ_APPROVED,
      subjectId,
      metadata: { quizId },
      tx,
    });

    // Award question bonuses
    for (const question of fullQuiz.questions) {
      await awardPoints({
        userId: fullQuiz.contributorId,
        points: POINT_VALUES.QUIZ_QUESTION,
        reason: POINT_REASONS.QUIZ_QUESTION_ADDED,
        subjectId,
        metadata: {
          quizId,
          questionId: question.id,
        },
        tx,
      });
    }

    // Award moderator action points
    await awardPoints({
      userId: session.user.id,
      points: POINT_VALUES.MODERATOR_APPROVAL,
      reason: POINT_REASONS.CONTENT_APPROVED_BY_MODERATOR,
      subjectId,
      metadata: { quizId, moderatorAction: true },
      tx,
    });
  });

  // Notify contributor of approval (fire and forget)
  const quizData = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      contributor: { select: { email: true, name: true } },
      chapter: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (quizData) {
    notifyContributorOfDecision({
      recipientEmail: quizData.contributor.email,
      recipientName: quizData.contributor.name,
      contentType: "QUIZ",
      contentId: quizData.id,
      contentTitle: quizData.title,
      subjectId: quizData.chapter.subject.id,
      subjectName: quizData.chapter.subject.name,
      chapterTitle: quizData.chapter.title,
      chapterId: quizData.chapterId,
      decision: "APPROVED",
    }).catch(err =>
      console.error("[Email] Failed to notify contributor:", err)
    );
  }

  return { success: true };
}

export async function rejectQuiz(data: z.infer<typeof RejectQuizSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = RejectQuizSchema.parse(data);
  const quiz = await getQuizWithSubject(validated.quizId);
  const subjectId = quiz.chapter.subjectId;
  await checkModeratorAccess(session.user.id, subjectId);

  await prisma.$transaction(async tx => {
    // Atomically update quiz status - only if still PENDING
    const updateResult = await tx.quiz.updateMany({
      where: {
        id: validated.quizId,
        status: ContentStatus.PENDING, // Atomic check
      },
      data: {
        status: ContentStatus.REJECTED,
        rejectionReason: validated.reason,
      },
    });

    // If no rows updated, quiz was already processed
    if (updateResult.count === 0) {
      throw new Error("Quiz has already been processed");
    }

    // Award moderator points for reviewing content
    await awardPoints({
      userId: session.user.id,
      points: POINT_VALUES.MODERATOR_REJECTION,
      reason: POINT_REASONS.CONTENT_REJECTED_BY_MODERATOR,
      subjectId,
      metadata: { quizId: validated.quizId, moderatorAction: true },
      tx,
    });
  });

  // Notify contributor of rejection (fire and forget)
  const quizData = await prisma.quiz.findUnique({
    where: { id: validated.quizId },
    include: {
      contributor: { select: { email: true, name: true } },
      chapter: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (quizData) {
    notifyContributorOfDecision({
      recipientEmail: quizData.contributor.email,
      recipientName: quizData.contributor.name,
      contentType: "QUIZ",
      contentId: quizData.id,
      contentTitle: quizData.title,
      subjectId: quizData.chapter.subject.id,
      subjectName: quizData.chapter.subject.name,
      chapterTitle: quizData.chapter.title,
      chapterId: quizData.chapterId,
      decision: "REJECTED",
      rejectionReason: validated.reason,
    }).catch(err =>
      console.error("[Email] Failed to notify contributor:", err)
    );
  }

  return { success: true };
}

export async function getQuizForModeratorPreview(quizId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Get quiz with all details
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, isDeleted: false },
    include: {
      contributor: {
        select: {
          id: true,
          name: true,
        },
      },
      chapter: {
        select: {
          id: true,
          title: true,
          subjectId: true,
        },
      },
      questions: {
        include: {
          options: {
            orderBy: { sequence: "asc" },
          },
        },
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Check moderator access for this subject
  await checkModeratorAccess(session.user.id, quiz.chapter.subjectId);

  return quiz;
}

export async function resolveReport(data: z.infer<typeof ResolveReportSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ResolveReportSchema.parse(data);

  // Get report with all related content to determine subjectId
  const report = await prisma.report.findUnique({
    where: { id: validated.reportId },
    include: {
      reportedCanvas: {
        select: {
          chapter: { select: { subjectId: true } },
        },
      },
      reportedComment: {
        select: {
          canvas: {
            select: {
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
      reportedQuiz: {
        select: {
          chapter: { select: { subjectId: true } },
        },
      },
      reportedQuizComment: {
        select: {
          quiz: {
            select: {
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
    },
  });

  if (!report) throw new Error("Report not found");
  if (report.status !== ReportStatus.PENDING) {
    throw new Error("Report has already been resolved");
  }

  // Determine subjectId from the reported content
  let subjectId: number;
  if (report.reportedCanvas) {
    subjectId = report.reportedCanvas.chapter.subjectId;
  } else if (report.reportedComment) {
    subjectId = report.reportedComment.canvas.chapter.subjectId;
  } else if (report.reportedQuiz) {
    subjectId = report.reportedQuiz.chapter.subjectId;
  } else if (report.reportedQuizComment) {
    subjectId = report.reportedQuizComment.quiz.chapter.subjectId;
  } else {
    throw new Error("Invalid report: no reported content found");
  }

  // Check moderator access
  await checkModeratorAccess(session.user.id, subjectId);

  await prisma.$transaction(async tx => {
    // Update report status with atomic check to prevent race conditions
    // Only update if status is still PENDING (prevents concurrent resolutions)
    const updateResult = await tx.report.updateMany({
      where: {
        id: validated.reportId,
        status: ReportStatus.PENDING, // Atomic check
      },
      data: {
        status: validated.resolution as ReportStatus,
        resolutionNotes: validated.notes || null,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    });

    // If no rows updated, report was already resolved by another moderator
    if (updateResult.count === 0) {
      throw new Error("Report has already been resolved by another moderator");
    }

    // Award moderator points for reviewing the report (always)
    await awardPoints({
      userId: session.user.id,
      points: POINT_VALUES.REPORT_RESOLVED,
      reason: POINT_REASONS.REPORT_RESOLVED,
      subjectId,
      metadata: {
        reportId: validated.reportId,
        resolution: validated.resolution,
      },
      tx,
    });

    // If report is valid (RESOLVED), award reporter points
    if (validated.resolution === "RESOLVED") {
      await awardPoints({
        userId: report.reporterUserId,
        points: POINT_VALUES.VALID_REPORT,
        reason: POINT_REASONS.VALID_REPORT,
        subjectId,
        metadata: {
          reportId: validated.reportId,
        },
        tx,
      });
    }
  });

  // Notify the reporter that their report has been resolved (fire and forget)
  const reporterData = await prisma.report.findUnique({
    where: { id: validated.reportId },
    include: {
      reporter: { select: { email: true, name: true } },
      reportedCanvas: { select: { title: true } },
      reportedQuiz: { select: { title: true } },
      reportedComment: { select: { text: true } },
      reportedQuizComment: { select: { text: true } },
    },
  });

  if (reporterData) {
    // Determine reported content type
    let reportedContentType: "CANVAS" | "QUIZ" | "COMMENT" | "QUIZ_COMMENT";
    let reportedContentTitle: string | undefined;

    if (reporterData.reportedCanvas) {
      reportedContentType = "CANVAS";
      reportedContentTitle = reporterData.reportedCanvas.title;
    } else if (reporterData.reportedQuiz) {
      reportedContentType = "QUIZ";
      reportedContentTitle = reporterData.reportedQuiz.title;
    } else if (reporterData.reportedComment) {
      reportedContentType = "COMMENT";
      reportedContentTitle = reporterData.reportedComment.text.slice(0, 50);
    } else {
      reportedContentType = "QUIZ_COMMENT";
      reportedContentTitle = reporterData.reportedQuizComment?.text?.slice(
        0,
        50
      );
    }

    notifyReporterOfResolution({
      recipientEmail: reporterData.reporter.email,
      recipientName: reporterData.reporter.name,
      resolution: validated.resolution as "RESOLVED" | "DISMISSED",
      reportedContentType,
      reportedContentTitle,
    }).catch(err => console.error("[Email] Failed to notify reporter:", err));
  }

  return { success: true };
}
