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
  // Get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = params.path.join("/");
  const url = new URL(request.url);
  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/chat/${path}${url.search}`;

  // Prepare headers for the backend
  const backendHeaders: HeadersInit = {
    "X-API-Key": INTERNAL_API_KEY || "",
    "X-User-ID": session.user.id,
  };

  // Forward content-type if present
  const contentType = request.headers.get("content-type");
  if (contentType) {
    backendHeaders["Content-Type"] = contentType;
  }

  // Prepare request options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers: backendHeaders,
  };

  // Forward body for POST/PATCH (use arrayBuffer for binary safety)
  if (request.method === "POST" || request.method === "PATCH") {
    const buffer = await request.arrayBuffer();
    fetchOptions.body = buffer;
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    const responseContentType = response.headers.get("content-type") || "";
    if (responseContentType.includes("text/event-stream")) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

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
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to chat service" },
      { status: 502 }
    );
  }
}
