"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("غير مصرح");
  }
  return session;
}

type ModeratorWithUser = Prisma.SubjectModeratorGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

async function revalidateModeratorPaths(subjectId: number) {
  if (!Number.isInteger(subjectId)) return;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      college: {
        select: {
          university: { select: { code: true } },
        },
      },
    },
  });
  if (!subject) return;

  revalidatePath("/admin/universities");
  revalidatePath(`/admin/subjects/${subjectId}`);
}

export async function listModeratorsBySubjectAction(
  subjectId: number
): Promise<ModeratorWithUser[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  if (!Number.isInteger(subjectId)) return [];
  try {
    return await prisma.subjectModerator.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function assignModeratorAction(
  subjectId: number,
  userId: string
): Promise<{ error: string } | { error: null; data: ModeratorWithUser }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "غير مصرح" };
  }

  if (!Number.isInteger(subjectId)) {
    return { error: "مادة غير صالحة" };
  }
  if (typeof userId !== "string" || !userId.trim()) {
    return { error: "مستخدم غير صالح" };
  }

  try {
    const [subject, user] = await Promise.all([
      prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, banned: true },
      }),
    ]);

    if (!subject) {
      return { error: "المادة غير موجودة" };
    }

    if (!user) {
      return { error: "المستخدم غير موجود" };
    }

    if (user.banned) {
      return { error: "لا يمكن تعيين مستخدم محظور كمشرف" };
    }

    const data = await prisma.subjectModerator.create({
      data: {
        subjectId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    await revalidateModeratorPaths(subjectId);
    return { error: null, data };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { error: "المستخدم مشرف بالفعل على هذه المادة" };
    }
    return { error: "فشل تعيين المشرف" };
  }
}

export async function removeModeratorAction(
  id: number,
  subjectId: number
): Promise<{ error: string } | { error: null }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "غير مصرح" };
  }

  if (!Number.isInteger(id) || !Number.isInteger(subjectId)) {
    return { error: "بيانات غير صالحة" };
  }
  try {
    await prisma.subjectModerator.delete({
      where: {
        id,
        subjectId,
      },
    });
    await revalidateModeratorPaths(subjectId);
    return { error: null };
  } catch {
    return { error: "فشل إزالة المشرف" };
  }
}

export async function searchUsersAction(query: string): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  }>
> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  if (typeof query !== "string" || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          {
            OR: [{ banned: { equals: false } }, { banned: { equals: null } }],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    return users;
  } catch {
    return [];
  }
}
