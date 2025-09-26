"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function listUniversitiesAction() {
  return prisma.university.findMany({
    orderBy: { createdAt: "desc" },
    include: { colleges: { include: { subjects: true } } },
  });
}

export async function getUniversityByCodeAction(code: string) {
  const normalized = code.trim().toUpperCase();
  return prisma.university.findUnique({
    where: { code: normalized },
    include: { colleges: { include: { subjects: true } } },
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
  try {
    const data = await prisma.university.create({ data: { name, code } });
    revalidatePath("/admin/universities");
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
  try {
    const data = await prisma.university.update({
      where: { id },
      data: { name, code },
    });
    revalidatePath("/admin/universities");
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
    revalidatePath("/admin/universities");
    return { error: null };
  } catch {
    return { error: "فشل الحذف" };
  }
}
