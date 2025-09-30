"use server";

import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type SubjectWithCounts = Prisma.SubjectGetPayload<{
  include: { _count: { select: { chapters: true } } };
}>;

async function revalidateSubjectPaths(collegeId: number) {
  if (!Number.isInteger(collegeId)) return;
  const college = await prisma.college.findUnique({
    where: { id: collegeId },
    select: {
      id: true,
      name: true,
      university: { select: { code: true } },
    },
  });
  if (!college) return;
  const universityCode = college.university.code;
  const encodedCode = encodeURIComponent(universityCode);
  const slug = slugify(college.name);
  const encodedSlug = encodeURIComponent(slug);

  revalidatePath("/admin/universities");
  revalidatePath(`/admin/universities/${encodedCode}`);
  revalidatePath(`/admin/universities/${encodedCode}/colleges/${encodedSlug}`);
}

export async function listSubjectsByCollegeAction(
  collegeId: number
): Promise<SubjectWithCounts[]> {
  if (!Number.isInteger(collegeId)) return [];
  return prisma.subject.findMany({
    where: { collegeId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { chapters: true } },
    },
  });
}

export async function createSubjectAction(
  formData: FormData
): Promise<{ error: string } | { error: null; data: SubjectWithCounts }> {
  const rawName = formData.get("name");
  const rawCode = formData.get("code");
  const rawDescription = formData.get("description");
  const rawCollegeId = formData.get("collegeId");

  if (typeof rawName !== "string" || !rawName.trim()) {
    return { error: "اسم المادة مطلوب" };
  }
  if (typeof rawCode !== "string" || !rawCode.trim()) {
    return { error: "كود المادة مطلوب" };
  }
  if (typeof rawCollegeId !== "string") {
    return { error: "كلية غير صالحة" };
  }

  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;
  const collegeId = Number(rawCollegeId);

  if (!Number.isInteger(collegeId)) {
    return { error: "كلية غير صالحة" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "كود المادة يجب أن يكون بالإنجليزية بدون مسافات أو رموز" };
  }

  try {
    const data = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        collegeId,
      },
      include: {
        _count: { select: { chapters: true } },
      },
    });
    await revalidateSubjectPaths(collegeId);
    return { error: null, data };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { error: "الكود مستخدم بالفعل" };
    }
    return { error: "فشل إنشاء المادة" };
  }
}

export async function updateSubjectAction(
  id: number,
  formData: FormData
): Promise<{ error: string } | { error: null; data: SubjectWithCounts }> {
  if (!Number.isInteger(id)) return { error: "مادة غير صالحة" };

  const rawName = formData.get("name");
  const rawCode = formData.get("code");
  const rawDescription = formData.get("description");
  const rawCollegeId = formData.get("collegeId");

  if (typeof rawName !== "string" || !rawName.trim()) {
    return { error: "اسم المادة مطلوب" };
  }
  if (typeof rawCode !== "string" || !rawCode.trim()) {
    return { error: "كود المادة مطلوب" };
  }
  if (typeof rawCollegeId !== "string") {
    return { error: "كلية غير صالحة" };
  }

  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;
  const collegeId = Number(rawCollegeId);

  if (!Number.isInteger(collegeId)) {
    return { error: "كلية غير صالحة" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "كود المادة يجب أن يكون بالإنجليزية بدون مسافات أو رموز" };
  }

  try {
    const data = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code,
        description,
      },
      include: {
        _count: { select: { chapters: true } },
      },
    });
    await revalidateSubjectPaths(collegeId);
    return { error: null, data };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { error: "الكود مستخدم بالفعل" };
    }
    return { error: "فشل تحديث المادة" };
  }
}

export async function deleteSubjectAction(
  id: number,
  collegeId: number
): Promise<{ error: string } | { error: null }> {
  if (!Number.isInteger(id) || !Number.isInteger(collegeId)) {
    return { error: "مادة غير صالحة" };
  }
  try {
    await prisma.subject.delete({ where: { id } });
    await revalidateSubjectPaths(collegeId);
    return { error: null };
  } catch {
    return { error: "فشل حذف المادة" };
  }
}
