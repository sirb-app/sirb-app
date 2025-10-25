"use server";

import type { Prisma, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type UserWithCounts = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        contributions: true;
        enrollments: true;
        moderatedSubjects: true;
      };
    };
  };
}>;

/**
 * Verifies admin authentication.
 */
async function requireAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function listUsersAction(params?: {
  search?: string;
  role?: UserRole;
  banned?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ users: UserWithCounts[]; total: number } | { error: string }> {
  try {
    await requireAdmin();

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.banned !== undefined) {
      where.banned = params.banned;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              contributions: true,
              enrollments: true,
              moderatedSubjects: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحميل المستخدمين" };
  }
}

export async function banUserAction(
  userId: string,
  reason: string,
  expiresAt?: Date
): Promise<{ error: string } | { error: null }> {
  try {
    const session = await requireAdmin();

    if (!userId || typeof userId !== "string") {
      return { error: "معرف المستخدم غير صالح" };
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return { error: "سبب الحظر مطلوب" };
    }

    if (
      expiresAt &&
      (!(expiresAt instanceof Date) || expiresAt <= new Date())
    ) {
      return { error: "تاريخ انتهاء الحظر غير صالح" };
    }

    if (session.user.id === userId) {
      return { error: "لا يمكنك حظر نفسك" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return { error: "المستخدم غير موجود" };
    }

    if (user.role === "ADMIN") {
      return { error: "لا يمكن حظر المسؤولين" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason,
        banExpires: expiresAt ?? null,
      },
    });

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل حظر المستخدم" };
  }
}

export async function unbanUserAction(
  userId: string
): Promise<{ error: string } | { error: null }> {
  try {
    await requireAdmin();

    if (!userId || typeof userId !== "string") {
      return { error: "معرف المستخدم غير صالح" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل إلغاء حظر المستخدم" };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole
): Promise<{ error: string } | { error: null }> {
  try {
    const session = await requireAdmin();

    if (!userId || typeof userId !== "string") {
      return { error: "معرف المستخدم غير صالح" };
    }

    if (session.user.id === userId) {
      return { error: "لا يمكنك تغيير صلاحياتك الخاصة" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!targetUser) {
      return { error: "المستخدم غير موجود" };
    }

    if (targetUser.role === "ADMIN") {
      return { error: "لا يمكن تغيير صلاحيات المسؤولين" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحديث الصلاحيات" };
  }
}

export async function getUserDetailsAction(
  userId: string
): Promise<{ user: UserWithDetails } | { error: string }> {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            contributions: true,
            enrollments: true,
            moderatedSubjects: true,
            comments: true,
            contentVotes: true,
            reportsSubmitted: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            enrolledAt: true,
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
          orderBy: { enrolledAt: "desc" },
          take: 10,
        },
        contributions: {
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
            createdAt: true,
            chapter: {
              select: {
                title: true,
                subject: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        moderatedSubjects: {
          select: {
            id: true,
            createdAt: true,
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
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return { error: "المستخدم غير موجود" };
    }

    return { user };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "فشل تحميل بيانات المستخدم" };
  }
}

type UserWithDetails = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        contributions: true;
        enrollments: true;
        moderatedSubjects: true;
        comments: true;
        contentVotes: true;
        reportsSubmitted: true;
      };
    };
    enrollments: {
      select: {
        id: true;
        enrolledAt: true;
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
    contributions: {
      select: {
        id: true;
        title: true;
        contentType: true;
        status: true;
        createdAt: true;
        chapter: {
          select: {
            title: true;
            subject: {
              select: {
                name: true;
                code: true;
              };
            };
          };
        };
      };
    };
    moderatedSubjects: {
      select: {
        id: true;
        createdAt: true;
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
  };
}>;
