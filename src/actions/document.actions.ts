"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

const FEATURE_DISABLED_ERROR = "ميزة معالجة المستندات غير مفعلة";
const FASTAPI_CONFIG_ERROR = "خادم FastAPI غير مهيأ";
const INVALID_FILE_ERROR = "ملف غير صالح";

function featureEnabled() {
  return process.env.ENABLE_RAG_UPLOADS === "true";
}

function resolveFastApiUploadUrl() {
  const explicit = process.env.FASTAPI_UPLOAD_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.FASTAPI_BASE_URL?.trim();
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/api/rag/v1/process`;
}

// TODO: Persist uploads once Prisma schema lands. For now we proxy to FastAPI only.
export async function uploadDocumentAction(formData: FormData) {
  if (!featureEnabled()) {
    return { error: FEATURE_DISABLED_ERROR } as const;
  }

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session || session.user.role !== "ADMIN") {
    return { error: "غير مصرح" } as const;
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: INVALID_FILE_ERROR } as const;
  }

  const uploadUrl = resolveFastApiUploadUrl();
  if (!uploadUrl) {
    return { error: FASTAPI_CONFIG_ERROR } as const;
  }

  const payload = new FormData();
  payload.append("file", file);
  payload.append("uploader_id", session.user.id);

  for (const key of [
    "subjectId",
    "chapterId",
    "title",
    "description",
    "includeImages",
  ]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim().length > 0) {
      payload.append(key, value.trim());
    }
  }

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: payload,
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { error: "فشل رفع الملف", response: body } as const;
    }

    return { error: null, data: body } as const;
  } catch (error) {
    return {
      error: "تعذر الاتصال بخادم FastAPI",
      response: error instanceof Error ? error.message : String(error),
    } as const;
  }
}
