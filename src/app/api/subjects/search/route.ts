import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const university = searchParams.get("university");
  const limit = parseInt(searchParams.get("limit") || "3");

  if (!search.trim()) {
    return NextResponse.json({ subjects: [] });
  }

  try {
    const where: Prisma.SubjectWhereInput = {
      AND: [
        // Search in name and code
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        },
        // Filter by university if provided
        university && university !== "all"
          ? { college: { universityId: parseInt(university) } }
          : {},
      ],
    };

    const subjects = await prisma.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        college: {
          select: {
            name: true,
            university: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: limit,
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search subjects" },
      { status: 500 }
    );
  }
}
