"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function saveVideoProgress(videoId: number, lastPosition: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        },
      },
      create: {
        userId: session.user.id,
        videoId: videoId,
        lastPosition: Math.floor(lastPosition),
        lastAccessed: new Date(),
      },
      update: {
        lastPosition: Math.floor(lastPosition),
        lastAccessed: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving video progress:", error);
    throw new Error("Failed to save progress");
  }
}
