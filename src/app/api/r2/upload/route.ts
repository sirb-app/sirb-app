import { r2Client } from "@/lib/r2-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Allowed MIME types for canvas file uploads
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z
    .string()
    .refine(
      (type) => ALLOWED_MIME_TYPES.includes(type as (typeof ALLOWED_MIME_TYPES)[number]),
      { message: "File type not allowed" }
    ),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  canvasId: z.number().int().positive(),
});

/**
 * Sanitize filename by keeping only safe characters and Arabic letters
 */
function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  const ext = lastDotIndex > -1 ? filename.slice(lastDotIndex) : "";
  const name = lastDotIndex > -1 ? filename.slice(0, lastDotIndex) : filename;

  // Keep ASCII alphanumeric, Arabic characters (U+0600-U+06FF), underscores, and hyphens
  const sanitized = name.replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_");

  return sanitized + ext;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { filename, contentType, size, canvasId } = validation.data;

    // Generate unique key with folder structure: canvas-files/{canvasId}/{uuid}-{filename}
    const sanitized = sanitizeFilename(filename);
    const uniqueKey = `canvas-files/${canvasId}/${uuidv4()}-${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600, // URL expires in 1 hour
    });

    return NextResponse.json({
      presignedUrl,
      key: uniqueKey,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
