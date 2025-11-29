import { getUniversityByCodeAction } from "@/actions/university.actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollegeManager } from "./_components/college-manager";
import { UniversityHeaderActions } from "./_components/university-header-actions";

export default async function UniversityByCodePage({
  params,
}: {
  params?: Promise<{ code?: string | string[] | undefined }>;
}) {
  const resolved = (params ? await params : {}) as { code?: string | string[] };
  const raw = Array.isArray(resolved.code) ? resolved.code[0] : resolved.code;
  let code = "";
  try {
    code = raw ? decodeURIComponent(raw).toUpperCase() : "";
  } catch {
    return notFound();
  }
  if (!code || code.length > 32) return notFound();

  const university = await getUniversityByCodeAction(code);
  if (!university) return notFound();

  const numberFormatter = new Intl.NumberFormat("ar-SA-u-nu-latn");
  const collegeCount = numberFormatter.format(university.colleges.length);

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="space-y-4">
        <Breadcrumb className="text-muted-foreground">
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
              <BreadcrumbPage>{university.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {university.name}
              </h1>
              <UniversityHeaderActions
                universityId={university.id}
                name={university.name}
                code={university.code}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              كود الجامعة: {university.code}
            </p>
            <p className="text-muted-foreground text-sm">
              عدد الكليات المسجلة: {collegeCount}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link
                href="/admin/universities"
                aria-label="الرجوع إلى قائمة الجامعات"
              >
                الرجوع للقائمة →
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CollegeManager
        universityId={university.id}
        universityCode={university.code}
        colleges={university.colleges}
      />
    </div>
  );
}
