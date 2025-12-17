import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client } from "@/lib/r2-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteSchema = z.object({
  key: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { key } = validation.data;

    // Verify the key is for canvas files
    if (!key.startsWith("canvas-files/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    // Extract canvasId from key format: canvas-files/{canvasId}/{uuid}-{filename}
    const pathParts = key.split("/");
    if (pathParts.length < 3) {
      return NextResponse.json(
        { error: "Invalid file path format" },
        { status: 400 }
      );
    }

    const canvasId = parseInt(pathParts[1]!, 10);
    if (isNaN(canvasId)) {
      return NextResponse.json({ error: "Invalid canvas ID" }, { status: 400 });
    }

    // Verify canvas ownership or moderator/admin access
    const canvas = await prisma.canvas.findUnique({
      where: { id: canvasId },
      select: {
        contributorId: true,
        isDeleted: true,
        chapter: { select: { subjectId: true } },
      },
    });

    if (!canvas || canvas.isDeleted) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    // Check if user is the canvas contributor
    const isContributor = canvas.contributorId === session.user.id;

    // Check if user is admin or moderator for this subject
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        moderatedSubjects: {
          where: { subjectId: canvas.chapter.subjectId },
        },
      },
    });

    const isAdmin = user?.role === "ADMIN";
    const isModerator = (user?.moderatedSubjects.length ?? 0) > 0;

    if (!isContributor && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
