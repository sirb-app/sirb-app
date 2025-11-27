"use server";

import { ContentStatus, UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

// --- Schemas ---

const CreateCanvasSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  chapterId: z.number(),
});

const UpdateCanvasSchema = z.object({
  canvasId: z.number(),
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const AddTextBlockSchema = z.object({
  canvasId: z.number(),
  content: z.string().min(1, "Content cannot be empty"),
});

const UpdateTextBlockSchema = z.object({
  blockId: z.number(),
  canvasId: z.number(),
  content: z.string().min(1, "Content cannot be empty"),
});

const AddVideoBlockSchema = z.object({
  canvasId: z.number(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid YouTube URL"),
  isOriginal: z.boolean().default(false),
});

const UpdateVideoBlockSchema = z.object({
  blockId: z.number(),
  canvasId: z.number(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid YouTube URL"),
  isOriginal: z.boolean().default(false),
});

const AddFileBlockSchema = z.object({
  canvasId: z.number(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid File URL"),
  fileSize: z.number(),
  mimeType: z.string(),
  isOriginal: z.boolean().default(false),
});

const UpdateFileBlockSchema = z.object({
  blockId: z.number(),
  canvasId: z.number(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid File URL"),
  mimeType: z.string(),
  isOriginal: z.boolean().default(false),
});

const ReorderBlocksSchema = z.object({
  canvasId: z.number(),
  updates: z.array(
    z.object({
      blockId: z.number(),
      sequence: z.number(),
    })
  ),
});

// --- Helpers ---

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

async function checkCanvasOwnership(canvasId: number, userId: string) {
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    select: {
      contributorId: true,
      status: true,
      chapter: { select: { subjectId: true } },
    },
  });

  if (!canvas) throw new Error("Canvas not found");

  if (canvas.contributorId === userId) return canvas;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === UserRole.ADMIN) return canvas;

  throw new Error("Unauthorized");
}

// --- Canvas Actions ---

export async function createCanvas(data: z.infer<typeof CreateCanvasSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = CreateCanvasSchema.parse(data);

  // Get next sequence
  const lastCanvas = await prisma.canvas.findFirst({
    where: { chapterId: validated.chapterId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  const sequence = (lastCanvas?.sequence ?? 0) + 1;

  const canvas = await prisma.canvas.create({
    data: {
      title: validated.title,
      description: validated.description,
      chapterId: validated.chapterId,
      contributorId: session.user.id,
      sequence,
      status: ContentStatus.DRAFT,
    },
  });

  return { success: true, canvasId: canvas.id };
}

export async function updateCanvas(data: z.infer<typeof UpdateCanvasSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateCanvasSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  await prisma.canvas.update({
    where: { id: validated.canvasId },
    data: {
      title: validated.title,
      description: validated.description,
      imageUrl: validated.imageUrl,
    },
  });

  return { success: true };
}

export async function deleteCanvas(canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const canvas = await checkCanvasOwnership(canvasId, session.user.id);

  if (canvas.status === ContentStatus.APPROVED) {
    // Soft delete
    await prisma.canvas.update({
      where: { id: canvasId },
      data: { isDeleted: true },
    });
  } else {
    // Hard delete
    await prisma.canvas.delete({
      where: { id: canvasId },
    });
  }

  return { success: true };
}

export async function submitCanvas(canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const canvas = await checkCanvasOwnership(canvasId, session.user.id);

  if (
    canvas.status !== ContentStatus.DRAFT &&
    canvas.status !== ContentStatus.REJECTED
  ) {
    throw new Error("Canvas cannot be submitted in current status");
  }

  await prisma.canvas.update({
    where: { id: canvasId },
    data: { status: ContentStatus.PENDING },
  });

  return { success: true };
}

export async function cancelSubmission(canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const canvas = await checkCanvasOwnership(canvasId, session.user.id);

  if (canvas.status !== ContentStatus.PENDING) {
    throw new Error("Canvas is not pending review");
  }

  await prisma.canvas.update({
    where: { id: canvasId },
    data: { status: ContentStatus.DRAFT },
  });

  return { success: true };
}

// --- Content Block Actions ---

async function getNextBlockSequence(canvasId: number) {
  const lastBlock = await prisma.contentBlock.findFirst({
    where: { canvasId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });
  return (lastBlock?.sequence ?? 0) + 1;
}

export async function addTextBlock(data: z.infer<typeof AddTextBlockSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = AddTextBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  return await prisma.$transaction(async tx => {
    const textContent = await tx.textContent.create({
      data: { content: validated.content },
    });

    const sequence = await getNextBlockSequence(validated.canvasId);

    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "TEXT",
        contentId: textContent.id,
      },
    });
    return block;
  });
}

export async function updateTextBlock(
  data: z.infer<typeof UpdateTextBlockSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateTextBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  const block = await prisma.contentBlock.findUnique({
    where: { id: validated.blockId },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "TEXT"
  ) {
    throw new Error("Block not found or invalid type");
  }

  await prisma.textContent.update({
    where: { id: block.contentId },
    data: { content: validated.content },
  });

  return { success: true };
}

function extractYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export async function addVideoBlock(data: z.infer<typeof AddVideoBlockSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = AddVideoBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  const videoId = extractYoutubeId(validated.url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  return await prisma.$transaction(async tx => {
    const video = await tx.video.create({
      data: {
        title: validated.title,
        url: validated.url,
        youtubeVideoId: videoId,
        duration: 0, // Pending duration fetch
        isOriginal: validated.isOriginal,
      },
    });

    const sequence = await getNextBlockSequence(validated.canvasId);

    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "VIDEO",
        contentId: video.id,
      },
    });
    return block;
  });
}

export async function updateVideoBlock(
  data: z.infer<typeof UpdateVideoBlockSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateVideoBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  const block = await prisma.contentBlock.findUnique({
    where: { id: validated.blockId },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "VIDEO"
  ) {
    throw new Error("Block not found or invalid type");
  }

  const videoId = extractYoutubeId(validated.url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  await prisma.video.update({
    where: { id: block.contentId },
    data: {
      title: validated.title,
      url: validated.url,
      youtubeVideoId: videoId,
      isOriginal: validated.isOriginal,
    },
  });

  return { success: true };
}

export async function addFileBlock(data: z.infer<typeof AddFileBlockSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = AddFileBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  return await prisma.$transaction(async tx => {
    const file = await tx.file.create({
      data: {
        title: validated.title,
        url: validated.url,
        fileSize: BigInt(validated.fileSize),
        mimeType: validated.mimeType,
        isOriginal: validated.isOriginal,
      },
    });

    const sequence = await getNextBlockSequence(validated.canvasId);

    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "FILE",
        contentId: file.id,
      },
    });
    return block;
  });
}

export async function updateFileBlock(
  data: z.infer<typeof UpdateFileBlockSchema>
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = UpdateFileBlockSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  const block = await prisma.contentBlock.findUnique({
    where: { id: validated.blockId },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "FILE"
  ) {
    throw new Error("Block not found or invalid type");
  }

  await prisma.file.update({
    where: { id: block.contentId },
    data: {
      title: validated.title,
      url: validated.url,
      mimeType: validated.mimeType,
      isOriginal: validated.isOriginal,
    },
  });

  return { success: true };
}

export async function deleteContentBlock(blockId: number, canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await checkCanvasOwnership(canvasId, session.user.id);

  await prisma.$transaction(async tx => {
    const block = await tx.contentBlock.findUnique({
      where: { id: blockId },
    });

    if (!block || block.canvasId !== canvasId) {
      throw new Error("Block not found");
    }

    // Delete specific content
    if (block.contentType === "TEXT") {
      await tx.textContent.delete({ where: { id: block.contentId } });
    } else if (block.contentType === "VIDEO") {
      await tx.video.delete({ where: { id: block.contentId } });
    } else if (block.contentType === "FILE") {
      await tx.file.delete({ where: { id: block.contentId } });
    }

    // Delete block
    await tx.contentBlock.delete({ where: { id: blockId } });

    // Resequence remaining blocks
    const remainingBlocks = await tx.contentBlock.findMany({
      where: { canvasId },
      orderBy: { sequence: "asc" },
    });

    for (let i = 0; i < remainingBlocks.length; i++) {
      if (remainingBlocks[i].sequence !== i + 1) {
        await tx.contentBlock.update({
          where: { id: remainingBlocks[i].id },
          data: { sequence: i + 1 },
        });
      }
    }
  });

  return { success: true };
}

export async function reorderBlocks(data: z.infer<typeof ReorderBlocksSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReorderBlocksSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  await prisma.$transaction(async tx => {
    for (const update of validated.updates) {
      await tx.contentBlock.update({
        where: { id: update.blockId },
        data: { sequence: update.sequence },
      });
    }
  });

  return { success: true };
}
