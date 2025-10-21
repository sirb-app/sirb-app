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
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChaptersManager } from "./_components/chapters-manager";
import { DocumentsManager } from "./_components/documents-manager";
import { SubjectHeaderActions } from "./_components/subject-header-actions";

export default async function SubjectByCodePage({
  params,
}: {
  params?: Promise<{
    code?: string | string[];
    slug?: string | string[];
    subjectCode?: string | string[];
  }>;
}) {
  const resolved = (params ? await params : {}) as {
    code?: string | string[];
    slug?: string | string[];
    subjectCode?: string | string[];
  };

  const rawCode = Array.isArray(resolved.code)
    ? resolved.code[0]
    : resolved.code;
  const rawSlug = Array.isArray(resolved.slug)
    ? resolved.slug[0]
    : resolved.slug;
  const rawSubjectCode = Array.isArray(resolved.subjectCode)
    ? resolved.subjectCode[0]
    : resolved.subjectCode;

  const universityCode = rawCode
    ? decodeURIComponent(rawCode).toUpperCase()
    : "";
  const collegeSlug = rawSlug ? decodeURIComponent(rawSlug).toLowerCase() : "";
  const subjectCode = rawSubjectCode
    ? decodeURIComponent(rawSubjectCode).toUpperCase()
    : "";

  if (
    !universityCode ||
    universityCode.length > 32 ||
    !collegeSlug ||
    !subjectCode
  ) {
    return notFound();
  }

  const subject = await prisma.subject.findFirst({
    where: {
      code: subjectCode,
      college: {
        university: { code: universityCode },
        name: { equals: collegeSlug.replace(/-/g, " "), mode: "insensitive" },
      },
    },
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
            select: { content: true },
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
    <div className="space-y-6 p-6" dir="rtl">
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
                <Link
                  href={`/admin/universities/${encodeURIComponent(subject.college.university.code)}`}
                >
                  {subject.college.university.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/admin/universities/${encodeURIComponent(subject.college.university.code)}/colleges/${encodeURIComponent(collegeSlug)}`}
                >
                  {subject.college.name}
                </Link>
              </BreadcrumbLink>
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
              <Link
                href={`/admin/universities/${encodeURIComponent(subject.college.university.code)}/colleges/${encodeURIComponent(collegeSlug)}`}
              >
                ← الرجوع للكلية
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            عدد الملتحقين
          </h2>
          <p className="mt-2 text-lg font-semibold">
            {numberFormatter.format(subject._count.enrollments)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            عدد الفصول
          </h2>
          <p className="mt-2 text-lg font-semibold">
            {numberFormatter.format(subject._count.chapters)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            المشرفون
          </h2>
          <p className="mt-2 text-lg font-semibold">
            {numberFormatter.format(subject._count.moderators)}
          </p>
        </div>
      </section>

      <ChaptersManager subjectId={subject.id} chapters={subject.chapters} />

      <DocumentsManager
        subjectId={subject.id}
        documents={[]}
        chapters={subject.chapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          sequence: ch.sequence,
        }))}
      />
    </div>
  );
}
