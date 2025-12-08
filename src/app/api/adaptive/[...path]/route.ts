import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL || "http://localhost:8000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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

  // Validate path segments to prevent path traversal
  const invalidSegment = params.path.find(
    segment => segment === ".." || segment.startsWith("/") || segment.includes("\\")
  );
  if (invalidSegment) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const path = params.path.join("/");
  const url = new URL(request.url);
  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/adaptive/${path}${url.search}`;

  const backendHeaders: HeadersInit = {
    "X-API-Key": INTERNAL_API_KEY || "",
    "X-User-ID": session.user.id,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) {
    backendHeaders["Content-Type"] = contentType;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: backendHeaders,
    signal: controller.signal,
  };

  if (request.method === "POST") {
    const buffer = await request.arrayBuffer();
    fetchOptions.body = buffer;
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);
    const responseText = await response.text();

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
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to connect to adaptive learning service" },
      { status: 502 }
    );
  }
}
