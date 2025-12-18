import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://localhost:8000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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
  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/adaptive/${path}${url.search}`;

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

    if (request.method === "POST") {
      const buffer = await request.arrayBuffer();
      fetchOptions.body = buffer;
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
      { error: "Failed to connect to adaptive learning service" },
      { status: 502 }
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
