import { getCollegeByIdAction } from "@/actions/university.actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollegeSettingsCard } from "./college-settings-card";

export default async function CollegePage({
  params,
}: {
  params?: Promise<{ code?: string | string[]; collegeId?: string | string[] }>;
}) {
  const resolved = (params ? await params : {}) as {
    code?: string | string[];
    collegeId?: string | string[];
  };
  const rawCode = Array.isArray(resolved.code)
    ? resolved.code[0]
    : resolved.code;
  const rawId = Array.isArray(resolved.collegeId)
    ? resolved.collegeId[0]
    : resolved.collegeId;

  const code = rawCode ? decodeURIComponent(rawCode).toUpperCase() : "";
  const collegeId = rawId ? Number(rawId) : NaN;

  if (!code || code.length > 32 || !Number.isInteger(collegeId))
    return notFound();

  const college = await getCollegeByIdAction(collegeId);
  if (!college || college.university.code !== code) return notFound();

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{college.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            الجامعة: {college.university.name} | الكود:{" "}
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

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h2 className="text-lg font-semibold">نظرة عامة</h2>
          <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
            <li>عدد المواد: {college._count?.subjects ?? 0}</li>
          </ul>
        </div>
        <CollegeSettingsCard
          collegeId={college.id}
          universityId={college.universityId}
          universityCode={college.university.code}
          initialName={college.name}
        />
      </section>
    </div>
  );
}
