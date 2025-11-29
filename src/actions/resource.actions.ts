"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { RagStatus } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { r2Client } from "@/lib/r2-client";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

const createResourceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  key: z.string().min(1),
  fileSize: z.bigint().positive(),
  mimeType: z.string().min(1),
  subjectId: z.number().int().positive(),
  chapterId: z.number().int().positive().optional(),
});

const resourceIdSchema = z.number().int().positive();

async function requireAdmin() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("غير مصرح");
  }
  return session;
}

export async function generateUploadUrl(input: {
  filename: string;
  contentType: string;
  subjectId: number;
}) {
  try {
    await requireAdmin();

    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const sanitizedName =
      input.filename.replace(/[^a-zA-Z0-9.-]/g, "_") || "file";
    const key = `subjects/${input.subjectId}/${timestamp}-${randomId}-${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    return { error: null, data: { uploadUrl, key } } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "فشل إنشاء رابط الرفع" } as const;
  }
}

export async function createSubjectResource(input: {
  title: string;
  description?: string;
  key: string;
  fileSize: bigint;
  mimeType: string;
  subjectId: number;
  chapterId?: number;
}) {
  try {
    await requireAdmin();

    const validated = createResourceSchema.parse(input);

    const subject = await prisma.subject.findUnique({
      where: { id: validated.subjectId },
      select: { id: true },
    });

    if (!subject) {
      return { error: "المادة غير موجودة" } as const;
    }

    if (validated.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: validated.chapterId },
        select: { id: true, subjectId: true },
      });

      if (!chapter || chapter.subjectId !== validated.subjectId) {
        return { error: "الفصل غير موجود أو لا ينتمي لهذه المادة" } as const;
      }
    }

    const resource = await prisma.subjectResource.create({
      data: {
        title: validated.title,
        description: validated.description,
        url: validated.key,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        subjectId: validated.subjectId,
        chapterId: validated.chapterId,
        isIndexed: false,
        ragStatus: null,
      },
    });

    return { error: null, data: resource } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "بيانات غير صالحة", details: error.issues } as const;
    }
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "حدث خطأ غير متوقع" } as const;
  }
}

export async function triggerResourceIndexing(resourceId: number) {
  try {
    const session = await requireAdmin();

    const validated = resourceIdSchema.parse(resourceId);

    const resource = await prisma.subjectResource.findUnique({
      where: { id: validated },
      select: {
        id: true,
        isIndexed: true,
        ragStatus: true,
        mimeType: true,
        url: true,
      },
    });

    if (!resource) {
      return { error: "المورد غير موجود" } as const;
    }

    if (resource.isIndexed) {
      return { error: "تمت فهرسة المورد مسبقًا" } as const;
    }

    if (
      resource.ragStatus === RagStatus.PENDING ||
      resource.ragStatus === RagStatus.PROCESSING
    ) {
      return { error: "الفهرسة قيد التنفيذ" } as const;
    }

    if (resource.mimeType !== "application/pdf") {
      return { error: "الفهرسة مدعومة لملفات PDF فقط" } as const;
    }

    const baseUrl = process.env.FASTAPI_BASE_URL?.trim();
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!baseUrl || !apiKey) {
      return { error: "خادم الذكاء الاصطناعي غير مهيأ" } as const;
    }

    const ingestUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/ingest`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-User-ID": session.user.id,
        },
        body: JSON.stringify({
          resource_id: resource.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        await prisma.subjectResource.update({
          where: { id: validated },
          data: { ragStatus: RagStatus.FAILED },
        });
        return {
          error: body?.detail ?? "فشل بدء عملية الفهرسة",
          status: response.status,
        } as const;
      }

      await prisma.subjectResource.update({
        where: { id: validated },
        data: { ragStatus: RagStatus.PENDING },
      });

      return {
        error: null,
        data: {
          documentId: body?.document_id,
          resourceId: resource.id,
          status: body?.status ?? "PENDING",
        },
      } as const;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        return { error: "انتهت مهلة الاتصال بالخادم" } as const;
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "معرف مورد غير صالح" } as const;
    }
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "حدث خطأ غير متوقع" } as const;
  }
}

export async function getSubjectResources(subjectId: number) {
  try {
    await requireAdmin();

    const validated = resourceIdSchema.parse(subjectId);

    const resources = await prisma.subjectResource.findMany({
      where: { subjectId: validated },
      include: {
        chapter: {
          select: { id: true, title: true, sequence: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { error: null, data: resources } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "معرف مادة غير صالح" } as const;
    }
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "حدث خطأ غير متوقع" } as const;
  }
}

export async function deleteSubjectResource(
  resourceId: number,
  revalidatePathname?: string
) {
  try {
    const session = await requireAdmin();

    const validated = resourceIdSchema.parse(resourceId);

    const resource = await prisma.subjectResource.findUnique({
      where: { id: validated },
      select: { id: true, url: true, isIndexed: true },
    });

    if (!resource) {
      return { error: "المورد غير موجود" } as const;
    }

    if (resource.isIndexed) {
      const baseUrl = process.env.FASTAPI_BASE_URL?.trim();
      const apiKey = process.env.INTERNAL_API_KEY;

      if (!baseUrl || !apiKey) {
        return {
          error: "خادم الذكاء الاصطناعي غير مهيأ - لا يمكن حذف المورد المفهرس",
        } as const;
      }

      const deleteUrl = `${baseUrl.replace(/\/$/, "")}/api/v1/ingest/${validated}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            "X-API-Key": apiKey,
            "X-User-ID": session.user.id,
          },
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          return { error: "انتهت مهلة الاتصال بالخادم" } as const;
        }
        throw err;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        return {
          error: body?.detail ?? "فشل حذف بيانات الفهرسة - حاول مرة أخرى",
          status: response.status,
        } as const;
      }
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: resource.url,
      });
      await r2Client.send(command);
    } catch {
      // R2 cleanup is best-effort
    }

    await prisma.subjectResource.delete({
      where: { id: validated },
    });

    if (revalidatePathname) {
      revalidatePath(revalidatePathname);
    }

    return { error: null, data: { deleted: true } } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "معرف مورد غير صالح" } as const;
    }
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "حدث خطأ غير متوقع" } as const;
  }
}

export async function getResourceStatus(resourceId: number) {
  try {
    await requireAdmin();

    const validated = resourceIdSchema.parse(resourceId);

    const resource = await prisma.subjectResource.findUnique({
      where: { id: validated },
      select: {
        id: true,
        isIndexed: true,
        ragStatus: true,
      },
    });

    if (!resource) {
      return { error: "المورد غير موجود" } as const;
    }

    return { error: null, data: resource } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "معرف مورد غير صالح" } as const;
    }
    if (error instanceof Error) {
      return { error: error.message } as const;
    }
    return { error: "حدث خطأ غير متوقع" } as const;
  }
}
