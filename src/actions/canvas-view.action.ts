"use server";

import { auth } from "@/lib/auth";
import { awardPoints } from "@/lib/points";
import { POINT_REASONS, POINT_VALUES } from "@/lib/points-config";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function trackCanvasView(canvasId: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      // Don't track views for unauthenticated users
      return;
    }

    const userId = session.user.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get or create canvas progress record
    const progress = await prisma.canvasProgress.findUnique({
      where: {
        userId_canvasId: {
          userId,
          canvasId,
        },
      },
      select: {
        lastViewed: true,
      },
    });

    // Only count view if user hasn't viewed in the last 24 hours
    if (!progress || progress.lastViewed < twentyFourHoursAgo) {
      await prisma.$transaction(async tx => {
        // Update or create progress record with new lastViewed
        await tx.canvasProgress.upsert({
          where: {
            userId_canvasId: {
              userId,
              canvasId,
            },
          },
          create: {
            userId,
            canvasId,
            lastViewed: new Date(),
            lastAccessed: new Date(),
          },
          update: {
            lastViewed: new Date(),
          },
        });

        // Get canvas details for contributor and subject
        const canvas = await tx.canvas.findUnique({
          where: { id: canvasId },
          select: {
            contributorId: true,
            chapter: { select: { subjectId: true } },
          },
        });

        if (!canvas) return;

        // Increment view count
        await tx.canvas.update({
          where: { id: canvasId },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });

        // Award points to contributor for the view (no caps)
        // Include date in metadata to allow re-awarding after 24h windows
        const viewDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        await awardPoints({
          userId: canvas.contributorId,
          points: POINT_VALUES.CANVAS_VIEW,
          reason: POINT_REASONS.CANVAS_VIEW_RECEIVED,
          subjectId: canvas.chapter.subjectId,
          metadata: { canvasId, viewerId: userId, viewDate },
          tx,
        });
      });
    }
  } catch (error) {
    // Silently fail - view tracking shouldn't break the page
    console.error("Error tracking canvas view:", error);
  }
}
