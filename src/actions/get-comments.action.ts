"use server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const COMMENTS_PER_PAGE = 10;

type CommentWithReplies = Prisma.CommentGetPayload<{
  select: {
    id: true;
    text: true;
    createdAt: true;
    editedAt: true;
    upvotesCount: true;
    downvotesCount: true;
    netScore: true;
    isDeleted: true;
    isPinned: true;
    isAnnouncement: true;
    userId: true;
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    replies: {
      select: {
        id: true;
        text: true;
        createdAt: true;
        editedAt: true;
        upvotesCount: true;
        downvotesCount: true;
        netScore: true;
        isDeleted: true;
        isPinned: true;
        isAnnouncement: true;
        userId: true;
        user: {
          select: {
            id: true;
            name: true;
            image: true;
          };
        };
      };
    };
  };
}>;

type GetCommentsResult = {
  comments: CommentWithReplies[];
  nextCursor: number | null;
  hasMore: boolean;
};

export async function getComments(
  canvasId: number,
  cursor?: number,
  sortBy: "best" | "newest" = "best"
): Promise<GetCommentsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    const whereClause: {
      canvasId: number;
      parentCommentId: null;
      OR: Array<{
        isDeleted: boolean;
        replies?: { some: { isDeleted: boolean } };
      }>;
      id?: { lt: number };
    } = {
      canvasId: canvasId,
      parentCommentId: null,
      OR: [
        { isDeleted: false },
        {
          isDeleted: true,
          replies: {
            some: {
              isDeleted: false,
            },
          },
        },
      ],
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    const orderBy: Array<{
      netScore?: "desc";
      createdAt?: "desc";
      id?: "desc";
    }> = [];
    if (sortBy === "best") {
      orderBy.push({ netScore: "desc" as const });
    } else {
      orderBy.push({ createdAt: "desc" as const });
    }
    orderBy.push({ id: "desc" as const });

    const comments = await prisma.comment.findMany({
      where: whereClause,
      select: {
        id: true,
        text: true,
        createdAt: true,
        editedAt: true,
        upvotesCount: true,
        downvotesCount: true,
        netScore: true,
        isDeleted: true,
        isPinned: true,
        isAnnouncement: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          where: { isDeleted: false },
          select: {
            id: true,
            text: true,
            createdAt: true,
            editedAt: true,
            upvotesCount: true,
            downvotesCount: true,
            netScore: true,
            isDeleted: true,
            isPinned: true,
            isAnnouncement: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy,
      take: COMMENTS_PER_PAGE + 1,
    });

    const sortedComments = [...comments].sort((a, b) => {
      if (a.isAnnouncement !== b.isAnnouncement) {
        return a.isAnnouncement ? -1 : 1;
      }

      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (sortBy === "best") {
        return b.netScore - a.netScore;
      } else {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    });

    const hasMore = sortedComments.length > COMMENTS_PER_PAGE;
    const paginatedComments = hasMore
      ? sortedComments.slice(0, COMMENTS_PER_PAGE)
      : sortedComments;

    const nextCursor = hasMore
      ? (paginatedComments[paginatedComments.length - 1]?.id ?? null)
      : null;

    return {
      comments: paginatedComments,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw new Error("Failed to fetch comments");
  }
}
