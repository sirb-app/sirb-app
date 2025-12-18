import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { BookOpen, Shield, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChaptersManager } from "./_components/chapters-manager";
import { DocumentsManager } from "./_components/documents-manager";
import { ModeratorsManager } from "./_components/moderators-manager";
import { SubjectHeaderActions } from "./_components/subject-header-actions";

export default async function SubjectPage({
  params,
}: {
  params?: Promise<{ subjectId?: string | string[] }>;
}) {
  const resolved = (params ? await params : {}) as {
    subjectId?: string | string[];
  };

  const rawId = Array.isArray(resolved.subjectId)
    ? resolved.subjectId[0]
    : resolved.subjectId;

  const subjectId = rawId ? parseInt(rawId, 10) : NaN;

  if (isNaN(subjectId) || subjectId <= 0) {
    return notFound();
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      college: {
        include: {
          university: true,
        },
      },
      chapters: {
        orderBy: { sequence: "asc" },
        include: {
          _count: {
            select: { canvases: true },
          },
        },
      },
      moderators: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      subjectResources: {
        orderBy: { createdAt: "desc" },
        include: {
          chapter: {
            select: { id: true, title: true, sequence: true },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
          chapters: true,
          moderators: true,
        },
      },
    },
  });

  if (!subject) return notFound();

  const numberFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">لوحة التحكم</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/universities">إدارة الجامعات</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/universities">
                  {subject.college.university.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">
                {subject.college.name}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{subject.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {subject.name}
              </h1>
              <span className="bg-muted text-muted-foreground rounded px-2.5 py-1 text-sm font-medium uppercase">
                {subject.code}
              </span>
              <SubjectHeaderActions
                subjectId={subject.id}
                collegeId={subject.collegeId}
                initialName={subject.name}
                initialCode={subject.code}
                initialDescription={subject.description}
              />
            </div>
            {subject.description && (
              <p className="text-muted-foreground text-sm">
                {subject.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/admin/universities">إدارة الجامعات →</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card group rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                عدد الملتحقين
              </h2>
              <p className="mt-1 text-2xl font-bold">
                {numberFormatter.format(subject._count.enrollments)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card group rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                عدد الفصول
              </h2>
              <p className="mt-1 text-2xl font-bold">
                {numberFormatter.format(subject._count.chapters)}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="#moderators"
          className="bg-card group hover:border-primary rounded-lg border p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-11 w-11 items-center justify-center rounded-lg transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                المشرفون
              </h2>
              <p className="mt-1 text-2xl font-bold">
                {numberFormatter.format(subject._count.moderators)}
              </p>
            </div>
          </div>
        </Link>
      </section>

      <section id="moderators">
        <ModeratorsManager
          subjectId={subject.id}
          moderators={subject.moderators}
        />
      </section>

      <ChaptersManager subjectId={subject.id} chapters={subject.chapters} />

      <DocumentsManager
        subjectId={subject.id}
        resources={subject.subjectResources}
        chapters={subject.chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          sequence: ch.sequence,
        }))}
      />
    </div>
  );
}
