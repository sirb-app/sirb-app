"use server";

import { Prisma, ReportReason, ReportStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    reporter: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    reportedUser: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    reportedCanvas: {
      select: {
        id: true;
        title: true;
        description: true;
        chapter: {
          select: {
            id: true;
            title: true;
            subjectId: true;
            subject: {
              select: {
                id: true;
                name: true;
                code: true;
                college: {
                  select: {
                    id: true;
                    name: true;
                    university: {
                      select: {
                        id: true;
                        name: true;
                        code: true;
                        imageUrl: true;
                      };
                    };
                  };
                };
              };
            };
          };
        };
        contributor: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    reportedComment: {
      select: {
        id: true;
        text: true;
        createdAt: true;
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
        canvas: {
          select: {
            id: true;
            title: true;
            chapter: {
              select: {
                id: true;
                title: true;
                subjectId: true;
                subject: {
                  select: {
                    id: true;
                    name: true;
                    code: true;
                    college: {
                      select: {
                        id: true;
                        name: true;
                        university: {
                          select: {
                            id: true;
                            name: true;
                            code: true;
                            imageUrl: true;
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    resolver: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

type ReportType = "canvas" | "comment" | "user";

export async function getReports(
  page: number = 1,
  pageSize: number = 10,
  status?: ReportStatus,
  reason?: ReportReason,
  type?: ReportType,
  universityId?: number,
  subjectId?: number
) {
  if (
    !Number.isInteger(page) ||
    !Number.isInteger(pageSize) ||
    page < 1 ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new Error("Invalid pagination parameters");
  }
  if (
    universityId !== undefined &&
    (universityId < 1 || !Number.isInteger(universityId))
  ) {
    throw new Error("Invalid university ID");
  }
  if (
    subjectId !== undefined &&
    (subjectId < 1 || !Number.isInteger(subjectId))
  ) {
    throw new Error("Invalid subject ID");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  let moderatedSubjectIds: number[] = [];
  if (!isAdmin) {
    const moderatedSubjects = await prisma.subjectModerator.findMany({
      where: { userId },
      select: { subjectId: true },
    });
    moderatedSubjectIds = moderatedSubjects.map(m => m.subjectId);

    if (moderatedSubjectIds.length === 0) {
      return { reports: [], total: 0, totalPages: 0 };
    }
  }

  const where: Prisma.ReportWhereInput = {
    ...(status && { status }),
    ...(reason && { reason }),
    ...(type === "canvas" && { reportedCanvasId: { not: null } }),
    ...(type === "comment" && { reportedCommentId: { not: null } }),
    ...(type === "user" && { reportedUserId: { not: null } }),
  };

  if (!isAdmin) {
    where.OR = [
      {
        reportedCanvas: {
          chapter: {
            subjectId: { in: moderatedSubjectIds },
          },
        },
      },
      {
        reportedComment: {
          canvas: {
            chapter: {
              subjectId: { in: moderatedSubjectIds },
            },
          },
        },
      },
    ];
  } else if (universityId || subjectId) {
    const filters: any[] = [];

    if (subjectId) {
      filters.push(
        {
          reportedCanvas: {
            chapter: {
              subjectId,
            },
          },
        },
        {
          reportedComment: {
            canvas: {
              chapter: {
                subjectId,
              },
            },
          },
        }
      );
    } else if (universityId) {
      filters.push(
        {
          reportedCanvas: {
            chapter: {
              subject: {
                college: {
                  universityId,
                },
              },
            },
          },
        },
        {
          reportedComment: {
            canvas: {
              chapter: {
                subject: {
                  college: {
                    universityId,
                  },
                },
              },
            },
          },
        }
      );
    }

    if (filters.length > 0) {
      where.OR = filters;
    }
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reportedCanvas: {
          select: {
            id: true,
            title: true,
            description: true,
            chapter: {
              select: {
                id: true,
                title: true,
                subjectId: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    college: {
                      select: {
                        id: true,
                        name: true,
                        university: {
                          select: {
                            id: true,
                            name: true,
                            code: true,
                            imageUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            contributor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reportedComment: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            canvas: {
              select: {
                id: true,
                title: true,
                chapter: {
                  select: {
                    id: true,
                    title: true,
                    subjectId: true,
                    subject: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                        college: {
                          select: {
                            id: true,
                            name: true,
                            university: {
                              select: {
                                id: true,
                                name: true,
                                code: true,
                                imageUrl: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateReportStatus(
  reportId: number,
  status: ReportStatus,
  resolutionNotes?: string
) {
  if (reportId < 1 || !Number.isInteger(reportId)) {
    throw new Error("Invalid report ID");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  if (!isAdmin) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: {
        reportedCanvas: {
          select: {
            chapter: {
              select: { subjectId: true },
            },
          },
        },
        reportedComment: {
          select: {
            canvas: {
              select: {
                chapter: {
                  select: { subjectId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    const subjectId =
      report.reportedCanvas?.chapter.subjectId ||
      report.reportedComment?.canvas.chapter.subjectId;

    if (!subjectId) {
      throw new Error(
        "Unauthorized: User reports can only be handled by admins"
      );
    }

    const isModerator = await prisma.subjectModerator.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId,
        },
      },
    });

    if (!isModerator) {
      throw new Error("Unauthorized: Not a moderator for this subject");
    }
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolutionNotes,
      resolvedAt: status !== "PENDING" ? new Date() : null,
      resolvedBy: status !== "PENDING" ? session.user.id : null,
    },
  });

  return { success: true, report };
}

export async function resolveReportWithAction(
  reportId: number,
  action: {
    deleteContent?: boolean;
    banUser?: boolean;
    banReason?: string;
    banDuration?: number;
    resolutionNotes?: string;
  }
) {
  if (reportId < 1 || !Number.isInteger(reportId)) {
    throw new Error("Invalid report ID");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reportedCanvas: {
        select: {
          id: true,
          contributorId: true,
          chapter: { select: { subjectId: true } },
        },
      },
      reportedComment: {
        select: {
          id: true,
          userId: true,
          canvas: {
            select: {
              chapter: { select: { subjectId: true } },
            },
          },
        },
      },
      reportedUser: {
        select: {
          id: true,
          role: true,
        },
      },
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  // Authorization check
  if (!isAdmin) {
    const subjectId =
      report.reportedCanvas?.chapter.subjectId ||
      report.reportedComment?.canvas?.chapter.subjectId;

    if (!subjectId || report.reportedUserId) {
      throw new Error(
        "Unauthorized: User reports can only be handled by admins"
      );
    }

    const isModerator = await prisma.subjectModerator.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId,
        },
      },
    });

    if (!isModerator) {
      throw new Error("Unauthorized: Not a moderator for this subject");
    }
  }

  if (report.status !== "PENDING") {
    throw new Error("Report has already been resolved");
  }

  return prisma.$transaction(async tx => {
    if (action.deleteContent) {
      if (report.reportedCanvasId) {
        await tx.comment.updateMany({
          where: { canvasId: report.reportedCanvasId },
          data: { isDeleted: true },
        });
        await tx.canvas.delete({
          where: { id: report.reportedCanvasId },
        });
      } else if (report.reportedCommentId) {
        await tx.comment.update({
          where: { id: report.reportedCommentId },
          data: { isDeleted: true },
        });
      }
    }

    if (action.banUser) {
      if (!isAdmin) {
        throw new Error("Only admins can ban users");
      }

      let targetUserId: string | null = null;

      if (report.reportedUserId) {
        if (report.reportedUser?.role === "ADMIN") {
          throw new Error("Cannot ban admin users");
        }
        targetUserId = report.reportedUserId;
      } else if (report.reportedCanvas?.contributorId) {
        const contributor = await tx.user.findUnique({
          where: { id: report.reportedCanvas.contributorId },
          select: { role: true },
        });
        if (contributor?.role === "ADMIN") {
          throw new Error("Cannot ban admin users");
        }
        targetUserId = report.reportedCanvas.contributorId;
      } else if (report.reportedComment?.userId) {
        const commenter = await tx.user.findUnique({
          where: { id: report.reportedComment.userId },
          select: { role: true },
        });
        if (commenter?.role === "ADMIN") {
          throw new Error("Cannot ban admin users");
        }
        targetUserId = report.reportedComment.userId;
      }

      if (!targetUserId) {
        throw new Error("No user to ban for this report");
      }

      const banExpires = action.banDuration
        ? new Date(Date.now() + action.banDuration * 24 * 60 * 60 * 1000)
        : null;

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          banned: true,
          banReason: action.banReason || "Reported content violation",
          banExpires,
        },
      });
    }

    await tx.report.update({
      where: { id: reportId },
      data: {
        status: "RESOLVED",
        resolutionNotes: action.resolutionNotes,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    });

    return { success: true };
  });
}

export async function getAvailableUniversities() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  if (!isAdmin) {
    const moderatedSubjects = await prisma.subjectModerator.findMany({
      where: { userId },
      select: {
        subject: {
          select: {
            college: {
              select: {
                university: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const uniqueUniversities = Array.from(
      new Map(
        moderatedSubjects.map(m => [
          m.subject.college.university.id,
          m.subject.college.university,
        ])
      ).values()
    );

    return uniqueUniversities.sort((a, b) => a.name.localeCompare(b.name));
  }

  const universities = await prisma.university.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return universities;
}

export async function getSubjectsByUniversity(universityId: number) {
  if (universityId < 1 || !Number.isInteger(universityId)) {
    throw new Error("Invalid university ID");
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  const where: any = {
    college: {
      universityId,
    },
  };

  if (!isAdmin) {
    const moderatedSubjects = await prisma.subjectModerator.findMany({
      where: { userId },
      select: { subjectId: true },
    });

    const moderatedSubjectIds = moderatedSubjects.map(m => m.subjectId);

    if (moderatedSubjectIds.length === 0) {
      return [];
    }

    where.id = { in: moderatedSubjectIds };
  }

  const subjects = await prisma.subject.findMany({
    where,
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return subjects;
}
