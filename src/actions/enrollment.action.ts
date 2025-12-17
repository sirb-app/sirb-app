"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function toggleEnrollment(subjectId: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول" };
  }

  try {
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId: session.user.id,
          subjectId,
        },
      },
    });

    if (existingEnrollment) {
      await prisma.enrollment.delete({
        where: {
          userId_subjectId: {
            userId: session.user.id,
            subjectId,
          },
        },
      });

      return { success: true, isEnrolled: false };
    } else {
      await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          subjectId,
        },
      });

      return { success: true, isEnrolled: true };
    }
  } catch (error) {
    console.error("Enrollment toggle error:", error);
    return { success: false, error: "حدث خطأ أثناء تحديث التسجيل" };
  }
}
