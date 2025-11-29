import { listUniversitiesAction } from "@/actions/university.actions";
import UniversitiesManager from "./_components/universities-manager";

export default async function Page() {
  let universities;
  try {
    universities = await listUniversitiesAction();
  } catch {
    return (
      <div className="container py-8">
        <div className="bg-destructive/10 text-destructive rounded-lg border p-4">
          فشل تحميل الجامعات
        </div>
      </div>
    );
  }
  return <UniversitiesManager universities={universities} />;
}
