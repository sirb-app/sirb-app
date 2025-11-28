import { r2Client } from "@/lib/r2-client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const downloadSchema = z.object({
  fileId: z.string().transform(Number),
});

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request params
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    const validation = downloadSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const { fileId } = validation.data;

    // Get file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { url: true, title: true, mimeType: true },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Extract original filename from R2 key (after the UUID)
    const keyParts = file.url.split('/');
    const fileKey = keyParts[keyParts.length - 1]; // e.g., "uuid-filename.pdf"
    const originalFilename = fileKey.substring(fileKey.indexOf('-') + 1); // Remove UUID prefix

    // Generate presigned download URL with proper filename
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: file.url, // url field stores the R2 key
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
    });

    const downloadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
