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
import { BookMarked, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollegeHeaderActions } from "../_components/college-header-actions";
import { SubjectsManager } from "../_components/subjects-manager";

export default async function CollegeBySlugPage({
  params,
}: {
  params?: Promise<{ code?: string | string[]; slug?: string | string[] }>;
}) {
  const resolved = (params ? await params : {}) as {
    code?: string | string[];
    slug?: string | string[];
  };
  const rawCode = Array.isArray(resolved.code)
    ? resolved.code[0]
    : resolved.code;
  const rawSlug = Array.isArray(resolved.slug)
    ? resolved.slug[0]
    : resolved.slug;

  const code = rawCode ? decodeURIComponent(rawCode).toUpperCase() : "";
  const slug = rawSlug ? decodeURIComponent(rawSlug).toLowerCase() : "";
  if (!code || code.length > 32 || !slug) return notFound();

  const college = await prisma.college.findFirst({
    where: {
      university: { code },
      name: { equals: slug.replace(/-/g, " "), mode: "insensitive" },
    },
    include: {
      university: true,
      _count: { select: { subjects: true } },
      subjects: { include: { _count: { select: { chapters: true } } } },
    },
  });

  if (!college) return notFound();

  const subjectCount = college._count.subjects;
  const dateFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    dateStyle: "medium",
  });
  const numberFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn");
  const createdAtLabel = dateFormatter.format(college.createdAt);
  const updatedAtLabel = dateFormatter.format(college.updatedAt);

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
                  href={`/admin/universities/${encodeURIComponent(college.university.code)}`}
                >
                  {college.university.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{college.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {college.name}
              </h1>
              <CollegeHeaderActions
                collegeId={college.id}
                universityId={college.universityId}
                universityCode={college.university.code}
                initialName={college.name}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              الجامعة: {college.university.name} | كود الجامعة:{" "}
              {college.university.code}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                href={`/admin/universities/${encodeURIComponent(college.university.code)}`}
              >
                ← الرجوع للجامعة
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card group rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                عدد المواد
              </h2>
              <p className="mt-1 text-2xl font-bold">
                {numberFormatter.format(subjectCount)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card group rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                تاريخ الإنشاء
              </h2>
              <p className="text-foreground mt-1 text-sm font-medium">
                {createdAtLabel}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card group rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                آخر تحديث
              </h2>
              <p className="text-foreground mt-1 text-sm font-medium">
                {updatedAtLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SubjectsManager
        collegeId={college.id}
        universityCode={college.university.code}
        collegeSlug={slug}
        subjects={college.subjects}
      />
    </div>
  );
}
