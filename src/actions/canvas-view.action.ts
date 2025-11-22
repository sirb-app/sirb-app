"use server";

import { auth } from "@/lib/auth";
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
      await prisma.$transaction([
        // Update or create progress record with new lastViewed
        prisma.canvasProgress.upsert({
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
        }),
        // Increment view count
        prisma.canvas.update({
          where: { id: canvasId },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        }),
      ]);
    }
  } catch (error) {
    // Silently fail - view tracking shouldn't break the page
    console.error("Error tracking canvas view:", error);
  }
}
