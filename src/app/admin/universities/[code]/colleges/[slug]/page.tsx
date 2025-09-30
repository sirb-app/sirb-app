import { prisma } from "@/lib/prisma";
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
      <div className="flex items-start justify-between gap-4">
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
          <p className="text-muted-foreground mt-1 text-sm">
            الجامعة: {college.university.name} | كود الجامعة:{" "}
            {college.university.code}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/universities/${encodeURIComponent(college.university.code)}`}
            className="text-primary z-50 text-sm hover:underline"
          >
            ← الرجوع للجامعة
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            عدد المواد
          </h2>
          <p className="mt-2 text-lg font-semibold">
            {numberFormatter.format(subjectCount)}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            تاريخ الإنشاء
          </h2>
          <p className="text-foreground mt-2 text-sm font-medium">
            {createdAtLabel}
          </p>
        </div>
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-muted-foreground text-sm font-medium">
            آخر تحديث
          </h2>
          <p className="text-foreground mt-2 text-sm font-medium">
            {updatedAtLabel}
          </p>
        </div>
      </section>

      <SubjectsManager collegeId={college.id} subjects={college.subjects} />
    </div>
  );
}
