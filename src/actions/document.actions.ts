"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

const FEATURE_DISABLED_ERROR = "ميزة معالجة المستندات غير مفعلة";
const FASTAPI_CONFIG_ERROR = "خادم FastAPI غير مهيأ";
const INVALID_FILE_ERROR = "ملف غير صالح";
const FILE_TOO_LARGE_ERROR = "حجم الملف يتجاوز الحد المسموح (100 ميجابايت)";
const INVALID_FILE_TYPE_ERROR = "نوع الملف غير مدعوم";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

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

  if (file.size > MAX_FILE_SIZE) {
    return { error: FILE_TOO_LARGE_ERROR } as const;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: INVALID_FILE_TYPE_ERROR } as const;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        error: "فشل رفع الملف",
        status: response.status,
        response: body,
      } as const;
    }

    return { error: null, data: body } as const;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return { error: "انتهت مهلة الاتصال بالخادم" } as const;
    }
    return {
      error: "تعذر الاتصال بخادم FastAPI",
      response: error instanceof Error ? error.message : String(error),
    } as const;
  }
}
