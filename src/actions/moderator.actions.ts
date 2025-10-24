"use server";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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
      code: true,
      college: {
        select: {
          name: true,
          university: { select: { code: true } },
        },
      },
    },
  });
  if (!subject) return;

  const universityCode = subject.college.university.code;
  const encodedCode = encodeURIComponent(universityCode);
  const slug = slugify(subject.college.name);
  const encodedSlug = encodeURIComponent(slug);
  const encodedSubjectCode = encodeURIComponent(subject.code);

  revalidatePath("/admin/universities");
  revalidatePath(`/admin/universities/${encodedCode}`);
  revalidatePath(`/admin/universities/${encodedCode}/colleges/${encodedSlug}`);
  revalidatePath(
    `/admin/universities/${encodedCode}/colleges/${encodedSlug}/subjects/${encodedSubjectCode}`
  );
}

export async function listModeratorsBySubjectAction(
  subjectId: number
): Promise<ModeratorWithUser[]> {
  if (!Number.isInteger(subjectId)) return [];
  return prisma.subjectModerator.findMany({
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
}

export async function assignModeratorAction(
  subjectId: number,
  userId: string
): Promise<{ error: string } | { error: null; data: ModeratorWithUser }> {
  if (!Number.isInteger(subjectId)) {
    return { error: "مادة غير صالحة" };
  }
  if (typeof userId !== "string" || !userId.trim()) {
    return { error: "مستخدم غير صالح" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return { error: "المستخدم غير موجود" };
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

export async function searchUsersAction(
  query: string
): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  }>
> {
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
