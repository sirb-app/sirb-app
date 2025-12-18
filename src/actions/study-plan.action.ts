"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CreateStudyPlanInput = {
  subjectId: number;
  title: string;
  selectedChapterIds: number[];
  startWithAssessment: boolean;
};

export type CreateStudyPlanResult =
  | { success: true; studyPlanId: string; startAssessment: boolean }
  | { success: false; error: string };

export async function createStudyPlan(
  input: CreateStudyPlanInput
): Promise<CreateStudyPlanResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  const { subjectId, title, selectedChapterIds, startWithAssessment } = input;
  const uniqueChapterIds = Array.from(new Set(selectedChapterIds));

  if (uniqueChapterIds.length === 0) {
    return { success: false, error: "يجب اختيار فصل واحد على الأقل" };
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId: session.user.id,
          subjectId,
        },
      },
    });

    if (!enrollment) {
      return { success: false, error: "يجب التسجيل في المقرر أولاً" };
    }

    const validChaptersCount = await prisma.chapter.count({
      where: {
        id: { in: uniqueChapterIds },
        subjectId,
      },
    });

    if (validChaptersCount !== uniqueChapterIds.length) {
      return { success: false, error: "الفصول المختارة غير صالحة" };
    }

    // Create study plan with SETUP status
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        subjectId,
        title: title || "جلسة تعلم جديدة",
        selectedChapterIds: uniqueChapterIds,
        status: "SETUP",
        placementCompleted: !startWithAssessment,
      },
    });

    return {
      success: true,
      studyPlanId: studyPlan.id,
      startAssessment: startWithAssessment,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Create study plan error:", error);
    }
    return { success: false, error: "حدث خطأ أثناء إنشاء الجلسة" };
  }
}

export async function getStudyPlans(subjectId: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  try {
    const studyPlans = await prisma.studyPlan.findMany({
      where: {
        userId: session.user.id,
        subjectId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        selectedChapterIds: true,
        progressPercentage: true,
        placementCompleted: true,
        updatedAt: true,
      },
    });

    return studyPlans;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Get study plans error:", error);
    }
    return [];
  }
}

export async function deleteStudyPlan(
  studyPlanId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const result = await prisma.studyPlan.updateMany({
      where: {
        id: studyPlanId,
        userId: session.user.id,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) {
      return { success: false, error: "الجلسة غير موجودة أو غير مصرح" };
    }

    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Delete study plan error:", error);
    }
    return { success: false, error: "حدث خطأ أثناء حذف الجلسة" };
  }
}

export async function updateStudyPlanTitle(
  studyPlanId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  if (!title.trim()) {
    return { success: false, error: "العنوان لا يمكن أن يكون فارغاً" };
  }

  try {
    const result = await prisma.studyPlan.updateMany({
      where: {
        id: studyPlanId,
        userId: session.user.id,
        deletedAt: null,
      },
      data: { title: title.trim() },
    });

    if (result.count === 0) {
      return { success: false, error: "الجلسة غير موجودة أو غير مصرح" };
    }

    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Update study plan title error:", error);
    }
    return { success: false, error: "حدث خطأ أثناء تعديل العنوان" };
  }
}
