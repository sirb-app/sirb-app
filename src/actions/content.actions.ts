"use server";

import type { ContentStatus, Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ContentWithRelations = Prisma.ContentGetPayload<{
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

    const where: Prisma.ContentWhereInput = {};

    if (session.user.role !== "ADMIN") {
      const moderatedSubjects = await prisma.subjectModerator.findMany({
        where: { userId: session.user.id },
        select: { subjectId: true },
      });

      if (moderatedSubjects.length === 0) {
        return { content: [], total: 0 };
      }

      where.chapter = {
        subject: {
          id: { in: moderatedSubjects.map(m => m.subjectId) },
        },
      };
    }

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.contentType) {
      where.contentType =
        params.contentType as Prisma.ContentWhereInput["contentType"];
    }

    if (params?.subjectId) {
      where.chapter = {
        ...(where.chapter as object),
        subjectId: params.subjectId,
      };
    }

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
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
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  college: {
                    select: {
                      name: true,
                      university: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
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
      prisma.content.count({ where }),
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

    const content = await prisma.content.findUnique({
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

    if (content.status === "APPROVED") {
      return { error: "المحتوى موافق عليه بالفعل" };
    }

    await prisma.$transaction([
      prisma.content.update({
        where: { id: contentId },
        data: {
          status: "APPROVED",
          moderatorNotes: moderatorNotes ?? null,
          rejectionReason: null,
        },
      }),
      prisma.userPoints.create({
        data: {
          userId: content.contributorId,
          points: 10,
          reason: "content_approved",
          subjectId: content.chapter.subjectId,
        },
      }),
      prisma.user.update({
        where: { id: content.contributorId },
        data: {
          totalPoints: { increment: 10 },
        },
      }),
    ]);

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

    const content = await prisma.content.findUnique({
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

    await prisma.content.update({
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

    const content = await prisma.content.findUnique({
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

    await prisma.content.delete({
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
