"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidateUniversityPaths() {
  revalidatePath("/admin/universities");
}

export async function listUniversitiesAction() {
  return prisma.university.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      colleges: {
        include: {
          subjects: {
            include: { _count: { select: { chapters: true } } },
          },
          _count: { select: { subjects: true } },
        },
      },
    },
  });
}

export async function getUniversityByCodeAction(code: string) {
  const normalized = code.trim().toUpperCase();
  return prisma.university.findUnique({
    where: { code: normalized },
    include: {
      colleges: {
        include: {
          _count: { select: { subjects: true } },
        },
      },
    },
  });
}

export async function createUniversityAction(
  formData: FormData
): Promise<
  | { error: null; data: Awaited<ReturnType<typeof prisma.university.create>> }
  | { error: string }
> {
  const rawName = formData.get("name");
  const rawCode = formData.get("code");
  if (typeof rawName !== "string") return { error: "اسم غير صالح" };
  if (typeof rawCode !== "string") return { error: "كود غير صالح" };
  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  if (!name) return { error: "حقل الاسم مطلوب" };
  if (!code) return { error: "حقل الكود مطلوب" };
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "الكود يجب أن يكون بالإنجليزية بدون مسافات أو رموز" };
  }
  try {
    const data = await prisma.university.create({ data: { name, code } });
    revalidateUniversityPaths();
    return { error: null, data };
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      // PrismaClientKnownRequestError code P2002: Unique constraint failed
      (e as { code?: string }).code === "P2002"
    ) {
      return { error: "الكود مستخدم بالفعل" };
    }
    return { error: "خطأ غير متوقع" };
  }
}

export async function updateUniversityAction(
  id: number,
  formData: FormData
): Promise<
  | { error: null; data: Awaited<ReturnType<typeof prisma.university.update>> }
  | { error: string }
> {
  const rawName = formData.get("name");
  const rawCode = formData.get("code");
  if (typeof rawName !== "string") return { error: "اسم غير صالح" };
  if (typeof rawCode !== "string") return { error: "كود غير صالح" };
  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  if (!name) return { error: "حقل الاسم مطلوب" };
  if (!code) return { error: "حقل الكود مطلوب" };
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "الكود يجب أن يكون بالإنجليزية بدون مسافات أو رموز" };
  }
  try {
    const data = await prisma.university.update({
      where: { id },
      data: { name, code },
    });

    revalidateUniversityPaths();
    return { error: null, data };
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      (e as { code?: string }).code === "P2002"
    ) {
      return { error: "الكود مستخدم بالفعل" };
    }
    return { error: "خطأ غير متوقع" };
  }
}

export async function deleteUniversityAction(
  id: number
): Promise<{ error: null } | { error: string }> {
  try {
    await prisma.university.delete({ where: { id } });
    revalidateUniversityPaths();
    return { error: null };
  } catch {
    return { error: "فشل الحذف" };
  }
}

export async function createCollegeAction(
  formData: FormData
): Promise<
  | { error: null; data: Awaited<ReturnType<typeof prisma.college.create>> }
  | { error: string }
> {
  const rawName = formData.get("name");
  const rawUniversityId = formData.get("universityId");
  if (typeof rawName !== "string") return { error: "اسم غير صالح" };
  if (typeof rawUniversityId !== "string") return { error: "جامعة غير صالحة" };

  const name = rawName.trim();
  const universityId = Number(rawUniversityId);
  if (!name) return { error: "حقل اسم الكلية مطلوب" };
  if (!Number.isInteger(universityId)) return { error: "جامعة غير صالحة" };

  try {
    const data = await prisma.college.create({
      data: { name, universityId },
    });
    revalidateUniversityPaths();
    return { error: null, data };
  } catch {
    return { error: "فشل إنشاء الكلية" };
  }
}

export async function updateCollegeAction(
  id: number,
  formData: FormData
): Promise<
  | { error: null; data: Awaited<ReturnType<typeof prisma.college.update>> }
  | { error: string }
> {
  const rawName = formData.get("name");
  const rawUniversityId = formData.get("universityId");
  if (typeof rawName !== "string") return { error: "اسم غير صالح" };
  if (typeof rawUniversityId !== "string") return { error: "جامعة غير صالحة" };

  const name = rawName.trim();
  const universityId = Number(rawUniversityId);
  if (!name) return { error: "حقل اسم الكلية مطلوب" };
  if (!Number.isInteger(universityId)) return { error: "جامعة غير صالحة" };

  try {
    const result = await prisma.college.updateMany({
      where: { id, universityId },
      data: { name },
    });

    if (result.count === 0) {
      return { error: "الكلية غير موجودة أو لا تنتمي لهذه الجامعة" };
    }

    const data = await prisma.college.findUnique({
      where: { id },
    });

    revalidateUniversityPaths();
    return { error: null, data: data! };
  } catch {
    return { error: "فشل تحديث الكلية" };
  }
}

export async function deleteCollegeAction(
  id: number,
  universityId: number
): Promise<{ error: null } | { error: string }> {
  if (!Number.isInteger(universityId)) {
    return { error: "جامعة غير صالحة" };
  }
  try {
    const result = await prisma.college.deleteMany({
      where: { id, universityId },
    });

    if (result.count === 0) {
      return { error: "الكلية غير موجودة أو لا تنتمي لهذه الجامعة" };
    }

    revalidateUniversityPaths();
    return { error: null };
  } catch {
    return { error: "فشل حذف الكلية" };
  }
}

export async function getCollegeByIdAction(id: number) {
  if (!Number.isInteger(id)) return null;
  return prisma.college.findUnique({
    where: { id },
    include: {
      university: true,
      _count: { select: { subjects: true } },
    },
  });
}
