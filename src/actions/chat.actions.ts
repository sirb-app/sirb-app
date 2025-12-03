"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubjectForChat = {
  id: number;
  name: string;
  code: string;
  chapters: {
    id: number;
    title: string;
    sequence: number;
  }[];
};

async function getCurrentUser() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return null;
  }

  return session.user;
}

/**
 * Get user's enrolled subjects with their chapters for the chat interface.
 */
export async function getEnrolledSubjectsAction(): Promise<
  { error: string } | { error: null; data: SubjectForChat[] }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "يرجى تسجيل الدخول" };
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        subject: {
          include: {
            chapters: {
              orderBy: { sequence: "asc" },
              select: {
                id: true,
                title: true,
                sequence: true,
              },
            },
          },
        },
      },
    });

    const subjects = enrollments.map(e => ({
      id: e.subject.id,
      name: e.subject.name,
      code: e.subject.code,
      chapters: e.subject.chapters,
    }));

    return { error: null, data: subjects };
  } catch {
    return { error: "فشل تحميل المواد" };
  }
}

/**
 * Enroll a user in a subject (for testing/development).
 */
export async function enrollInSubjectAction(
  subjectId: number
): Promise<{ error: string } | { error: null }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "يرجى تسجيل الدخول" };
  }

  if (!Number.isInteger(subjectId)) {
    return { error: "معرف المادة غير صالح" };
  }

  try {
    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return { error: "المادة غير موجودة" };
    }

    // Create enrollment (upsert to avoid duplicates)
    await prisma.enrollment.upsert({
      where: {
        userId_subjectId: {
          userId: user.id,
          subjectId,
        },
      },
      create: {
        userId: user.id,
        subjectId,
      },
      update: {},
    });

    return { error: null };
  } catch {
    return { error: "فشل التسجيل في المادة" };
  }
}
