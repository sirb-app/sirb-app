"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ChapterWithCounts = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  sequence: number;
  subjectId: number;
  _count: { canvases: number };
};

async function requireAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("غير مصرح");
  }

  return session;
}

function revalidateChapterPaths(subjectId: number) {
  if (!Number.isInteger(subjectId)) return;
  revalidatePath("/admin/universities");
  revalidatePath(`/admin/subjects/${subjectId}`);
}

function getUniqueConstraintArabicMessage(target: unknown): string {
  const normalized = Array.isArray(target)
    ? target.map(t => String(t).toLowerCase()).join(",")
    : typeof target === "string"
      ? target.toLowerCase()
      : "";

  if (normalized.includes("subjectid") && normalized.includes("sequence")) {
    return "ترتيب الفصل مستخدم لهذه المادة بالفعل";
  }
  if (normalized.includes("title") && normalized.includes("subjectid")) {
    return "عنوان الفصل مستخدم بالفعل في هذه المادة";
  }
  return "قيمة فريدة مستخدمة بالفعل";
}

export async function createChapterAction(
  formData: FormData
): Promise<{ error: string } | { error: null; data: ChapterWithCounts }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawSequence = formData.get("sequence");
  const rawSubjectId = formData.get("subjectId");

  if (typeof rawTitle !== "string" || !rawTitle.trim()) {
    return { error: "عنوان الفصل مطلوب" };
  }
  if (typeof rawSequence !== "string") {
    return { error: "ترتيب الفصل مطلوب" };
  }
  if (typeof rawSubjectId !== "string") {
    return { error: "مادة غير صالحة" };
  }

  const title = rawTitle.trim();
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;
  const sequence = Number(rawSequence);
  const subjectId = Number(rawSubjectId);

  if (!Number.isInteger(subjectId)) {
    return { error: "مادة غير صالحة" };
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    return { error: "ترتيب الفصل يجب أن يكون رقم صحيح موجب" };
  }

  try {
    const data = await prisma.chapter.create({
      data: {
        title,
        description,
        sequence,
        subjectId,
      },
      include: {
        _count: { select: { canvases: true } },
      },
    });
    revalidateChapterPaths(subjectId);
    return { error: null, data };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      return { error: getUniqueConstraintArabicMessage(target) };
    }
    return { error: "فشل إنشاء الفصل" };
  }
}

export async function updateChapterAction(
  id: number,
  formData: FormData
): Promise<{ error: string } | { error: null; data: ChapterWithCounts }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  if (!Number.isInteger(id)) return { error: "فصل غير صالح" };

  let existing;
  try {
    existing = await prisma.chapter.findUnique({
      where: { id },
      select: { subjectId: true },
    });
  } catch {
    return { error: "فشل تحميل بيانات الفصل" };
  }
  if (!existing) {
    return { error: "فصل غير صالح" };
  }

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawSequence = formData.get("sequence");
  const rawSubjectId = formData.get("subjectId");

  if (typeof rawTitle !== "string" || !rawTitle.trim()) {
    return { error: "عنوان الفصل مطلوب" };
  }
  if (typeof rawSequence !== "string") {
    return { error: "ترتيب الفصل مطلوب" };
  }
  if (typeof rawSubjectId !== "string") {
    return { error: "مادة غير صالحة" };
  }

  const title = rawTitle.trim();
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;
  const sequence = Number(rawSequence);
  const subjectId = Number(rawSubjectId);

  if (!Number.isInteger(subjectId)) {
    return { error: "مادة غير صالحة" };
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    return { error: "ترتيب الفصل يجب أن يكون رقم صحيح موجب" };
  }

  try {
    const data = await prisma.chapter.update({
      where: { id },
      data: {
        title,
        description,
        sequence,
        subjectId,
      },
      include: {
        _count: { select: { canvases: true } },
      },
    });
    revalidateChapterPaths(subjectId);
    if (existing.subjectId !== subjectId) {
      revalidateChapterPaths(existing.subjectId);
    }
    return { error: null, data };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      return { error: getUniqueConstraintArabicMessage(target) };
    }
    return { error: "فشل تحديث الفصل" };
  }
}

export async function deleteChapterAction(
  id: number,
  subjectId: number
): Promise<{ error: string } | { error: null }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  if (!Number.isInteger(id) || !Number.isInteger(subjectId)) {
    return { error: "فصل غير صالح" };
  }

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: { subjectId: true },
    });

    if (!chapter) {
      return { error: "الفصل غير موجود" };
    }

    if (chapter.subjectId !== subjectId) {
      return { error: "الفصل لا ينتمي للمادة المحددة" };
    }

    await prisma.chapter.delete({ where: { id } });
    revalidateChapterPaths(subjectId);
    return { error: null };
  } catch {
    return { error: "فشل حذف الفصل" };
  }
}
