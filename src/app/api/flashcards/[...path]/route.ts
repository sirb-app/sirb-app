import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = (
  process.env.FASTAPI_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB

class PayloadTooLargeError extends Error {
  constructor() {
    super("Payload too large");
    this.name = "PayloadTooLargeError";
  }
}

async function readRequestBodyWithLimit(
  request: Request,
  limitBytes: number
): Promise<ArrayBuffer> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > limitBytes) {
      throw new PayloadTooLargeError();
    }
  }

  if (!request.body) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > limitBytes) throw new PayloadTooLargeError();
    return buffer;
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > limitBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

function normalizePathSegments(segments: string[]): string | null {
  if (!Array.isArray(segments)) return null;

  const normalized: string[] = [];
  for (const raw of segments) {
    if (!raw) return null;
    if (raw === "." || raw === "..") return null;
    if (raw.startsWith("/") || raw.includes("\\")) return null;

    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      return null;
    }

    if (!decoded) return null;
    if (decoded === "." || decoded === "..") return null;
    if (decoded.includes("/") || decoded.includes("\\")) return null;

    normalized.push(decoded);
  }

  return normalized.join("/");
}

function isSseRequest(request: Request, segments: string[]): boolean {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) return true;
  return segments.at(-1) === "stream";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

async function proxyRequest(request: Request, params: { path: string[] }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!INTERNAL_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const path = normalizePathSegments(params.path);
  if (!path) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const url = new URL(request.url);
  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/flashcards/${path}${url.search}`;

  const backendHeaders: HeadersInit = {
    "X-API-Key": INTERNAL_API_KEY,
    "X-User-ID": session.user.id,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) {
    backendHeaders["Content-Type"] = contentType;
  }

  const isStreamEndpoint = isSseRequest(request, params.path);
  const controller = new AbortController();
  const timeoutMs = isStreamEndpoint ? 120000 : 30000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: backendHeaders,
      signal: controller.signal,
    };

    if (request.method === "POST" || request.method === "PATCH") {
      try {
        fetchOptions.body = await readRequestBodyWithLimit(
          request,
          MAX_BODY_BYTES
        );
      } catch (err) {
        if (err instanceof PayloadTooLargeError) {
          return NextResponse.json(
            { error: "Request body too large" },
            { status: 413 }
          );
        }
        throw err;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    const responseContentType = response.headers.get("content-type") || "";
    if (responseContentType.includes("text/event-stream")) {
      if (!response.body) {
        return NextResponse.json(
          { error: "Upstream returned an empty stream" },
          { status: 502 }
        );
      }
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    const responseText = await response.text();

    if (!responseText) {
      return NextResponse.json({}, { status: response.status });
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: responseText || "Unknown error" },
        { status: response.status }
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to connect to flashcards service" },
      { status: 502 }
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
