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
  r2Key: z.string().min(1, "R2 key is required"),
  fileSize: z.number(),
  mimeType: z.string(),
  isOriginal: z.boolean().default(false),
  description: z.string().optional(),
});

const UpdateFileBlockSchema = z.object({
  blockId: z.number(),
  canvasId: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  r2Key: z.string().min(1).optional(), // For file replacement
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isOriginal: z.boolean().optional(),
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
      isDeleted: true,
      chapter: { select: { subjectId: true } },
    },
  });

  if (!canvas || canvas.isDeleted) throw new Error("Canvas not found");

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

  // Get next sequence (exclude soft-deleted canvases)
  const lastCanvas = await prisma.canvas.findFirst({
    where: {
      chapterId: validated.chapterId,
      isDeleted: false,
    },
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
      // status defaults to DRAFT in schema
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

async function getNextBlockSequence(
  canvasId: number,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const lastBlock = await tx.contentBlock.findFirst({
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
    // Get sequence INSIDE transaction for proper isolation
    const sequence = await getNextBlockSequence(validated.canvasId, tx);

    // Create ContentBlock first
    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "TEXT",
      },
    });

    // Create content with reference to ContentBlock
    await tx.textContent.create({
      data: {
        content: validated.content,
        contentBlockId: block.id,
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
    include: { textContent: true },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "TEXT" ||
    !block.textContent
  ) {
    throw new Error("Block not found or invalid type");
  }

  await prisma.textContent.update({
    where: { contentBlockId: validated.blockId },
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
    // Get sequence INSIDE transaction for proper isolation
    const sequence = await getNextBlockSequence(validated.canvasId, tx);

    // Create ContentBlock first
    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "VIDEO",
      },
    });

    // Create content with reference to ContentBlock
    await tx.video.create({
      data: {
        title: validated.title,
        url: validated.url,
        youtubeVideoId: videoId,
        duration: 0, // Pending duration fetch
        isOriginal: validated.isOriginal,
        contentBlockId: block.id,
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
    include: { video: true },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "VIDEO" ||
    !block.video
  ) {
    throw new Error("Block not found or invalid type");
  }

  const videoId = extractYoutubeId(validated.url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  await prisma.video.update({
    where: { contentBlockId: validated.blockId },
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
    // Get sequence INSIDE transaction for proper isolation
    const sequence = await getNextBlockSequence(validated.canvasId, tx);

    // Create ContentBlock first
    const block = await tx.contentBlock.create({
      data: {
        canvasId: validated.canvasId,
        sequence,
        contentType: "FILE",
      },
    });

    // Create content with reference to ContentBlock
    await tx.file.create({
      data: {
        title: validated.title,
        description: validated.description,
        url: validated.r2Key, // Store R2 key in url field
        fileSize: BigInt(validated.fileSize),
        mimeType: validated.mimeType,
        isOriginal: validated.isOriginal,
        contentBlockId: block.id,
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
    include: { file: true },
  });

  if (
    !block ||
    block.canvasId !== validated.canvasId ||
    block.contentType !== "FILE" ||
    !block.file
  ) {
    throw new Error("Block not found or invalid type");
  }

  // Get old file URL for cleanup if file is being replaced
  const oldKey = validated.r2Key ? block.file.url : null;

  // Update file with new data
  const updateData: any = {};
  if (validated.title) updateData.title = validated.title;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.r2Key) updateData.url = validated.r2Key; // Store new R2 key
  if (validated.fileSize) updateData.fileSize = BigInt(validated.fileSize);
  if (validated.mimeType) updateData.mimeType = validated.mimeType;
  if (validated.isOriginal !== undefined) updateData.isOriginal = validated.isOriginal;

  await prisma.file.update({
    where: { contentBlockId: validated.blockId },
    data: updateData,
  });

  // Return old key for cleanup if file was replaced
  return {
    success: true,
    oldKey,
  };
}

export async function deleteContentBlock(blockId: number, canvasId: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await checkCanvasOwnership(canvasId, session.user.id);

  let r2Key: string | null = null;

  await prisma.$transaction(async tx => {
    const block = await tx.contentBlock.findUnique({
      where: { id: blockId },
      include: { file: true },
    });

    if (!block || block.canvasId !== canvasId) {
      throw new Error("Block not found");
    }

    // Get R2 key before deleting file
    if (block.contentType === "FILE" && block.file) {
      r2Key = block.file.url;
    }

    // Delete ContentBlock (this will CASCADE delete the content due to onDelete: Cascade)
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

  return { success: true, r2Key };
}

export async function reorderBlocks(data: z.infer<typeof ReorderBlocksSchema>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const validated = ReorderBlocksSchema.parse(data);
  await checkCanvasOwnership(validated.canvasId, session.user.id);

  await prisma.$transaction(async tx => {
    // Two-phase update to avoid unique constraint violations:
    // Phase 1: Move all blocks to temporary negative sequences
    for (let i = 0; i < validated.updates.length; i++) {
      await tx.contentBlock.update({
        where: { id: validated.updates[i].blockId },
        data: { sequence: -(i + 1) }, // Use negative sequences temporarily
      });
    }

    // Phase 2: Set the final sequences
    for (const update of validated.updates) {
      await tx.contentBlock.update({
        where: { id: update.blockId },
        data: { sequence: update.sequence },
      });
    }
  });

  return { success: true };
}
