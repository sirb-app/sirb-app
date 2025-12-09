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

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour
const UPLOAD_RATE_LIMIT_MINUTES = 1; // Limit: 1 upload per minute
const MAX_UPLOADS_PER_MINUTE = 3; // Maximum uploads allowed per minute

// Map content types to file extensions
const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

const avatarUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z
    .string()
    .refine(
      type =>
        ALLOWED_IMAGE_TYPES.includes(
          type as (typeof ALLOWED_IMAGE_TYPES)[number]
        ),
      {
        message: "Only image files are allowed for avatars",
      }
    ),
  size: z.number().max(MAX_AVATAR_SIZE, "Avatar size must be less than 2MB"),
});

/**
 * Safely extract file extension from filename or content type
 */
function getFileExtension(filename: string, contentType: string): string {
  // Try to get extension from filename first
  const parts = filename.split(".");
  if (parts.length > 1) {
    const ext = parts[parts.length - 1]?.toLowerCase();
    // Validate that the extension matches allowed types
    if (ext && ["png", "jpg", "jpeg", "webp"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }

  // Fallback to content type
  const ext = CONTENT_TYPE_TO_EXTENSION[contentType];
  if (!ext) {
    throw new Error("Unable to determine valid file extension");
  }

  return ext;
}

/**
 * Simple in-memory rate limiting for avatar uploads
 * Maps userId to array of upload timestamps
 */
const uploadAttempts = new Map<string, number[]>();

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = UPLOAD_RATE_LIMIT_MINUTES * 60 * 1000;

  // Get or initialize user's upload attempts
  const attempts = uploadAttempts.get(userId) || [];

  // Filter out attempts outside the time window
  const recentAttempts = attempts.filter(
    timestamp => now - timestamp < windowMs
  );

  // Update the map with filtered attempts
  uploadAttempts.set(userId, recentAttempts);

  // Check if limit exceeded
  if (recentAttempts.length >= MAX_UPLOADS_PER_MINUTE) {
    return false;
  }

  // Add current attempt
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

    // Rate limiting check
    if (!checkUploadRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "يرجى الانتظار قبل رفع صورة أخرى" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = avatarUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { filename, contentType, size } = validation.data;

    // Get file extension with proper validation
    let ext: string;
    try {
      ext = getFileExtension(filename, contentType);
    } catch {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // Generate unique key with validated extension
    const uniqueKey = `user-avatars/${session.user.id}/${uuidv4()}.${ext}`;

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
    console.error("Error generating avatar upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
