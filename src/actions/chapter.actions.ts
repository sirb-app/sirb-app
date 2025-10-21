"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ChapterWithCounts = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  sequence: number;
  subjectId: number;
  _count: { content: number };
};

async function revalidateChapterPaths(subjectId: number) {
  if (!Number.isInteger(subjectId)) return;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
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

  const college = subject.college;
  const university = college?.university;

  // College or university could be missing when relations are optional
  if (!college || !university) {
    revalidatePath("/admin/universities");
    return;
  }

  const universityCode = university.code;
  const encodedUnivCode = encodeURIComponent(universityCode);
  const collegeSlug = college.name.toLowerCase().replace(/\s+/g, "-");
  const encodedCollegeSlug = encodeURIComponent(collegeSlug);
  const subjectCode = subject.code;
  const encodedSubjectCode = encodeURIComponent(subjectCode);

  revalidatePath("/admin/universities");
  revalidatePath(`/admin/universities/${encodedUnivCode}`);
  revalidatePath(
    `/admin/universities/${encodedUnivCode}/colleges/${encodedCollegeSlug}`
  );
  revalidatePath(
    `/admin/universities/${encodedUnivCode}/colleges/${encodedCollegeSlug}/subjects/${encodedSubjectCode}`
  );
}

function getUniqueConstraintArabicMessage(target: unknown): string {
  const normalized = Array.isArray(target)
    ? target.map(t => String(t).toLowerCase()).join(",")
    : typeof target === "string"
      ? target.toLowerCase()
      : "";

  // Schema-driven: handle known unique constraints for Chapter
  if (normalized.includes("subjectid") && normalized.includes("sequence")) {
    return "ترتيب الفصل مستخدم لهذه المادة بالفعل";
  }
  if (normalized.includes("chapterid") || normalized.includes("id")) {
    return "معرف الفصل مستخدم بالفعل";
  }
  if (normalized.includes("code") && normalized.includes("collegeid")) {
    return "رمز المادة مستخدم بالفعل في هذه الكلية";
  }
  if (normalized.includes("chapterid") && normalized.includes("sequence")) {
    return "ترتيب المحتوى مستخدم بالفعل في هذا الفصل";
  }
  return "قيمة فريدة مستخدمة بالفعل";
}

export async function createChapterAction(
  formData: FormData
): Promise<{ error: string } | { error: null; data: ChapterWithCounts }> {
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
        _count: { select: { content: true } },
      },
    });
    await revalidateChapterPaths(subjectId);
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
  if (!Number.isInteger(id)) return { error: "فصل غير صالح" };

  const existing = await prisma.chapter.findUnique({
    where: { id },
    select: { subjectId: true },
  });
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
        _count: { select: { content: true } },
      },
    });
    await revalidateChapterPaths(subjectId);
    if (existing.subjectId !== subjectId) {
      await revalidateChapterPaths(existing.subjectId);
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
  if (!Number.isInteger(id) || !Number.isInteger(subjectId)) {
    return { error: "فصل غير صالح" };
  }
  try {
    await prisma.chapter.delete({ where: { id } });
    await revalidateChapterPaths(subjectId);
    return { error: null };
  } catch {
    return { error: "فشل حذف الفصل" };
  }
}
