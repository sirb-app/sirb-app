import { auth } from "@/lib/auth";
import { r2Client } from "@/lib/r2-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

const MAX_CANVAS_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour
const UPLOAD_RATE_LIMIT_MINUTES = 1;
const MAX_UPLOADS_PER_MINUTE = 5;

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const canvasImageUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z
    .string()
    .refine(
      type =>
        ALLOWED_IMAGE_TYPES.includes(
          type as (typeof ALLOWED_IMAGE_TYPES)[number]
        ),
      {
        message: "Only image files are allowed",
      }
    ),
  size: z
    .number()
    .max(MAX_CANVAS_IMAGE_SIZE, "Image size must be less than 5MB"),
  canvasId: z.number().int().positive().optional(),
});

function getFileExtension(filename: string, contentType: string): string {
  const parts = filename.split(".");
  if (parts.length > 1) {
    const ext = parts[parts.length - 1]?.toLowerCase();
    if (ext && ["png", "jpg", "jpeg", "webp"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }

  const ext = CONTENT_TYPE_TO_EXTENSION[contentType];
  if (!ext) {
    throw new Error("Unable to determine valid file extension");
  }

  return ext;
}

const uploadAttempts = new Map<string, number[]>();

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = UPLOAD_RATE_LIMIT_MINUTES * 60 * 1000;

  const attempts = uploadAttempts.get(userId) || [];
  const recentAttempts = attempts.filter(
    timestamp => now - timestamp < windowMs
  );

  uploadAttempts.set(userId, recentAttempts);

  if (recentAttempts.length >= MAX_UPLOADS_PER_MINUTE) {
    return false;
  }

  recentAttempts.push(now);
  uploadAttempts.set(userId, recentAttempts);

  return true;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkUploadRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "يرجى الانتظار قبل رفع صورة أخرى" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = canvasImageUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { filename, contentType, size, canvasId } = validation.data;

    let ext: string;
    try {
      ext = getFileExtension(filename, contentType);
    } catch {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // Use canvas-specific path if canvasId provided, otherwise use temp path
    const uniqueKey = canvasId
      ? `canvas-images/${canvasId}/${uuidv4()}.${ext}`
      : `canvas-images/temp/${session.user.id}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME!,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uniqueKey}`;

    return NextResponse.json({
      presignedUrl,
      key: uniqueKey,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating canvas image upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
