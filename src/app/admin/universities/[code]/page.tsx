import { getUniversityByCodeAction } from "@/actions/university.actions";
import Link from "next/link";
import { notFound } from "next/navigation";

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {university.name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            الكود: {university.code}
          </p>
        </div>
        <Link
          href="/admin/universities"
          className="text-primary z-50 text-sm hover:underline"
          aria-label="الرجوع إلى قائمة الجامعات"
        >
          ← الرجوع
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">الكليات</h2>
        {university.colleges.length === 0 && (
          <p className="text-muted-foreground text-sm">لا توجد كليات بعد.</p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* TODO: improve below code after college addition logic*/}
          {university.colleges.map(college => (
            <li
              key={college.id}
              className="bg-card rounded-lg border p-4 shadow-sm"
            >
              <h3 className="mb-1 font-medium">{college.name}</h3>
              <p className="text-muted-foreground mb-2 text-xs">
                المواد: {college.subjects.length}
              </p>
              {college.subjects.length > 0 && (
                <ul className="text-xs leading-5">
                  {college.subjects.slice(0, 6).map(s => (
                    <li key={s.id} className="truncate">
                      {s.name}
                    </li>
                  ))}
                  {college.subjects.length > 6 && (
                    <li className="text-muted-foreground">… المزيد</li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">إدارة</h2>
        <p className="text-muted-foreground text-sm">
          general management tools and settings for the uni and maybe colleges.
        </p>
      </section>
    </div>
  );
}
