import { auth } from "@/lib/auth";
import { r2Client } from "@/lib/r2-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const deleteAvatarSchema = z.object({
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
    const validation = deleteAvatarSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { key } = validation.data;

    // Verify the key belongs to this user's avatars (security check)
    if (!key.startsWith(`user-avatars/${session.user.id}/`)) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME!,
      Key: key,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting avatar from R2:", error);
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
