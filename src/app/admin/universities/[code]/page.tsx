import { getUniversityByCodeAction } from "@/actions/university.actions";
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
  const code = raw ? decodeURIComponent(raw).toUpperCase() : "";
  if (!code || code.length > 32) return notFound();

  const university = await getUniversityByCodeAction(code);
  if (!university) return notFound();

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-start justify-between gap-4">
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
          <p className="text-muted-foreground mt-1 text-sm">
            الكود: {university.code}
          </p>
        </div>
        <Link
          href="/admin/universities"
          className="text-primary text-sm hover:underline"
          aria-label="الرجوع إلى قائمة الجامعات"
        >
          ← الرجوع
        </Link>
      </div>

      <CollegeManager
        universityId={university.id}
        universityCode={university.code}
        colleges={university.colleges}
      />
    </div>
  );
}
