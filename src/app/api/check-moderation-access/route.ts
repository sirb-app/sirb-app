import { UserRole } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ hasAccess: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      moderatedSubjects: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ hasAccess: false });
  }

  // Admin has access to all subjects
  if (user.role === UserRole.ADMIN) {
    return NextResponse.json({ hasAccess: true });
  }

  // Regular users need at least one moderated subject
  const hasAccess = user.moderatedSubjects.length > 0;
  return NextResponse.json({ hasAccess });
}
