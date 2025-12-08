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

  if (selectedChapterIds.length === 0) {
    return { success: false, error: "يجب اختيار فصل واحد على الأقل" };
  }

  try {
    // Check enrollment
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

    // Create study plan with SETUP status
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: session.user.id,
        subjectId,
        title: title || "جلسة تعلم جديدة",
        selectedChapterIds,
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
    console.error("Create study plan error:", error);
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
    console.error("Get study plans error:", error);
    return [];
  }
}

export async function deleteStudyPlan(studyPlanId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
    });

    if (!studyPlan) {
      return { success: false, error: "الجلسة غير موجودة" };
    }

    if (studyPlan.userId !== session.user.id) {
      return { success: false, error: "غير مصرح لك بحذف هذه الجلسة" };
    }

    await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete study plan error:", error);
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
    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
    });

    if (!studyPlan) {
      return { success: false, error: "الجلسة غير موجودة" };
    }

    if (studyPlan.userId !== session.user.id) {
      return { success: false, error: "غير مصرح لك بتعديل هذه الجلسة" };
    }

    await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: { title: title.trim() },
    });

    return { success: true };
  } catch (error) {
    console.error("Update study plan title error:", error);
    return { success: false, error: "حدث خطأ أثناء تعديل العنوان" };
  }
}
