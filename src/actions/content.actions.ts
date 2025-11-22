"use server";

import type { ContentStatus, Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ContentWithRelations = Prisma.CanvasGetPayload<{
  include: {
    contributor: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    chapter: {
      select: {
        id: true;
        title: true;
        sequence: true;
        subject: {
          select: {
            id: true;
            name: true;
            code: true;
            college: {
              select: {
                name: true;
                university: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    contentBlocks: {
      select: {
        contentType: true;
      };
    };
    _count: {
      select: {
        votes: true;
        comments: true;
        userProgress: true;
      };
    };
  };
}>;

async function requireAdminOrModerator(subjectId?: number) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role === "ADMIN") {
    return { session, isAdmin: true };
  }

  if (subjectId) {
    const isModerator = await prisma.subjectModerator.findFirst({
      where: {
        userId: session.user.id,
        subjectId,
      },
    });

    if (isModerator) {
      return { session, isAdmin: false };
    }
  }

  throw new Error("Unauthorized");
}

export async function listContentAction(params?: {
  status?: ContentStatus;
  contentType?: string;
  subjectId?: number;
  universityId?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<
  { content: ContentWithRelations[]; total: number } | { error: string }
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CanvasWhereInput = {};

    if (session.user.role !== "ADMIN") {
      const moderatedSubjects = await prisma.subjectModerator.findMany({
        where: { userId: session.user.id },
        select: {
          subject: {
            select: {
              id: true,
              college: {
                select: {
                  universityId: true,
                },
              },
            },
          },
        },
      });

      if (moderatedSubjects.length === 0) {
        return { content: [], total: 0 };
      }

      where.chapter = {
        subject: {
          id: {
            in: moderatedSubjects.map(m => m.subject.id),
          },
        },
      };
    }

    const normalizedStatus = params?.status?.toUpperCase() as
      | ContentStatus
      | undefined;
    if (
      normalizedStatus &&
      ["PENDING", "APPROVED", "REJECTED"].includes(normalizedStatus)
    ) {
      where.status = normalizedStatus;
    }

    const normalizedType = params?.contentType?.toUpperCase();
    if (normalizedType && normalizedType !== "ALL") {
      where.contentBlocks = {
        some: {
          contentType: normalizedType,
        },
      };
    }

    if (params?.subjectId) {
      where.chapter = {
        ...(where.chapter as object),
        subjectId: params.subjectId,
      };
    }

    if (params?.universityId) {
      where.chapter = {
        ...(where.chapter as object),
        subject: {
          ...(where.chapter?.subject as object),
          college: {
            ...(where.chapter?.subject?.college as object),
            universityId: params.universityId,
          },
        },
      };
    }

    const trimmedSearch = params?.search?.trim();
    if (trimmedSearch) {
      where.OR = [
        { title: { contains: trimmedSearch, mode: "insensitive" } },
        { description: { contains: trimmedSearch, mode: "insensitive" } },
        {
          contributor: {
            name: { contains: trimmedSearch, mode: "insensitive" },
          },
        },
        {
          contributor: {
            email: { contains: trimmedSearch, mode: "insensitive" },
          },
        },
        {
          chapter: {
            title: { contains: trimmedSearch, mode: "insensitive" },
          },
        },
      ];
    }

    const [content, total] = await Promise.all([
      prisma.canvas.findMany({
        where,
        include: {
          contributor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              sequence: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  college: {
                    select: {
                      id: true,
                      universityId: true,
                      name: true,
                      university: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          contentBlocks: {
            select: {
              contentType: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
              userProgress: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.canvas.count({ where }),
    ]);

    return { content, total };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحميل المحتوى" };
  }
}

export async function approveContentAction(
  contentId: number,
  moderatorNotes?: string
): Promise<{ error: string } | { error: null }> {
  try {
    if (!Number.isInteger(contentId)) {
      return { error: "معرف المحتوى غير صالح" };
    }

    const content = await prisma.canvas.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        status: true,
        contributorId: true,
        chapter: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    if (!content) {
      return { error: "المحتوى غير موجود" };
    }

    await requireAdminOrModerator(content.chapter.subjectId);

    const result = await prisma.$transaction(async tx => {
      const currentContent = await tx.canvas.findUnique({
        where: { id: contentId },
        select: { status: true, contributorId: true },
      });

      if (!currentContent || currentContent.status === "APPROVED") {
        return { alreadyApproved: true };
      }

      await tx.canvas.update({
        where: { id: contentId },
        data: {
          status: "APPROVED",
          moderatorNotes: moderatorNotes ?? null,
          rejectionReason: null,
        },
      });

      await tx.userPoints.create({
        data: {
          userId: content.contributorId,
          points: 10,
          reason: "content_approved",
          subjectId: content.chapter.subjectId,
        },
      });

      await tx.user.update({
        where: { id: content.contributorId },
        data: {
          totalPoints: { increment: 10 },
        },
      });

      return { alreadyApproved: false };
    });

    if (result.alreadyApproved) {
      return { error: "المحتوى موافق عليه بالفعل" };
    }

    revalidatePath("/admin/content");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل الموافقة على المحتوى" };
  }
}

export async function rejectContentAction(
  contentId: number,
  rejectionReason: string,
  moderatorNotes?: string
): Promise<{ error: string } | { error: null }> {
  try {
    if (!Number.isInteger(contentId)) {
      return { error: "معرف المحتوى غير صالح" };
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return { error: "سبب الرفض مطلوب" };
    }

    const content = await prisma.canvas.findUnique({
      where: { id: contentId },
      select: {
        status: true,
        chapter: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    if (!content) {
      return { error: "المحتوى غير موجود" };
    }

    await requireAdminOrModerator(content.chapter.subjectId);

    await prisma.canvas.update({
      where: { id: contentId },
      data: {
        status: "REJECTED",
        rejectionReason,
        moderatorNotes: moderatorNotes ?? null,
      },
    });

    revalidatePath("/admin/content");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل رفض المحتوى" };
  }
}

export async function deleteContentAction(
  contentId: number
): Promise<{ error: string } | { error: null }> {
  try {
    if (!Number.isInteger(contentId)) {
      return { error: "معرف المحتوى غير صالح" };
    }

    const content = await prisma.canvas.findUnique({
      where: { id: contentId },
      select: {
        chapter: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    if (!content) {
      return { error: "المحتوى غير موجود" };
    }

    await requireAdminOrModerator(content.chapter.subjectId);

    await prisma.canvas.delete({
      where: { id: contentId },
    });

    revalidatePath("/admin/content");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل حذف المحتوى" };
  }
}

export async function listSubjectsForFilterAction(): Promise<
  Array<{ id: number; name: string; code: string }> | { error: string }
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    if (session.user.role === "ADMIN") {
      const subjects = await prisma.subject.findMany({
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: "asc" },
        take: 100,
      });
      return subjects;
    }

    const moderatedSubjects = await prisma.subjectModerator.findMany({
      where: { userId: session.user.id },
      select: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });

    return moderatedSubjects.map(m => m.subject);
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحميل المواد" };
  }
}

export async function listUniversitiesForFilterAction(): Promise<
  Array<{ id: number; name: string }> | { error: string }
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    if (session.user.role === "ADMIN") {
      const universities = await prisma.university.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 100,
      });
      return universities;
    }

    const moderatedUniversities = await prisma.subjectModerator.findMany({
      where: { userId: session.user.id },
      select: {
        subject: {
          select: {
            college: {
              select: {
                university: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const unique = new Map<number, string>();
    moderatedUniversities.forEach(entry => {
      const uni = entry.subject.college.university;
      if (uni) {
        unique.set(uni.id, uni.name);
      }
    });

    return Array.from(unique.entries())
      .sort((a, b) => a[1].localeCompare(b[1], "ar"))
      .map(([id, name]) => ({ id, name }));
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحميل الجامعات" };
  }
}
