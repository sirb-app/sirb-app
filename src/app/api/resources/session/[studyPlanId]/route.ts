import { z } from "zod";

const FASTAPI_BASE_URL = (
  process.env.FASTAPI_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const paramsSchema = z.object({
  studyPlanId: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid studyPlanId format"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studyPlanId: string }> }
) {
  const result = paramsSchema.safeParse(await params);
  
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { studyPlanId } = result.data;

  const targetUrl = `${FASTAPI_BASE_URL}/api/v1/resources/session/${studyPlanId}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return Response.json(
        { error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json({ error: "Request timeout" }, { status: 504 });
    }
    return Response.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}
