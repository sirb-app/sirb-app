"use server";

import type { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type SubjectWithCounts = Prisma.SubjectGetPayload<{
  include: { _count: { select: { chapters: true } } };
}>;

async function requireAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return session;
}

async function revalidateSubjectPaths(collegeId: number, subjectId?: number) {
  if (!Number.isInteger(collegeId)) return;

  try {
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      select: {
        university: { select: { code: true } },
      },
    });

    if (!college?.university) return;

    revalidatePath("/admin/universities");
    if (subjectId) {
      revalidatePath(`/admin/subjects/${subjectId}`);
    }
  } catch {
    // Silent fail
  }
}

export async function listSubjectsByCollegeAction(
  collegeId: number
): Promise<SubjectWithCounts[] | { error: string }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  if (!Number.isInteger(collegeId)) {
    return { error: "معرف الكلية غير صالح" };
  }

  try {
    return await prisma.subject.findMany({
      where: { collegeId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { chapters: true } },
      },
    });
  } catch {
    return { error: "فشل تحميل المواد" };
  }
}
export async function createSubjectAction(
  formData: FormData
): Promise<{ error: string } | { error: null; data: SubjectWithCounts }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

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
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2003"
    ) {
      return { error: "الكلية غير موجودة" };
    }
    return { error: "فشل إنشاء المادة" };
  }
}

export async function updateSubjectAction(
  id: number,
  formData: FormData
): Promise<{ error: string } | { error: null; data: SubjectWithCounts }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  if (!Number.isInteger(id)) return { error: "مادة غير صالحة" };

  const rawName = formData.get("name");
  const rawCode = formData.get("code");
  const rawDescription = formData.get("description");

  if (typeof rawName !== "string" || !rawName.trim()) {
    return { error: "اسم المادة مطلوب" };
  }
  if (typeof rawCode !== "string" || !rawCode.trim()) {
    return { error: "كود المادة مطلوب" };
  }

  const name = rawName.trim();
  const code = rawCode.trim().toUpperCase();
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;

  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "كود المادة يجب أن يكون بالإنجليزية بدون مسافات أو رموز" };
  }

  try {
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      select: { collegeId: true },
    });

    if (!existingSubject) {
      return { error: "المادة غير موجودة" };
    }

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

    await revalidateSubjectPaths(existingSubject.collegeId, id);
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
  try {
    await requireAdmin();
  } catch {
    return { error: "فشل العملية" };
  }

  if (!Number.isInteger(id) || !Number.isInteger(collegeId)) {
    return { error: "مادة غير صالحة" };
  }

  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      select: { collegeId: true },
    });

    if (!subject) {
      return { error: "المادة غير موجودة" };
    }

    if (subject.collegeId !== collegeId) {
      return { error: "المادة لا تنتمي للكلية المحددة" };
    }

    await prisma.subject.delete({ where: { id } });
    await revalidateSubjectPaths(collegeId);
    return { error: null };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2003"
    ) {
      return { error: "لا يمكن حذف المادة لوجود فصول مرتبطة بها" };
    }
    return { error: "فشل حذف المادة" };
  }
}
