import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getEnrolledSubjectsAction } from "@/actions/chat.actions";
import { auth } from "@/lib/auth";
import { TutorClient } from "./_components/tutor-client";

export const metadata = {
  title: "المعلم الذكي | سرب",
  description: "تعلم مع المعلم الذكي المدعوم بالذكاء الاصطناعي",
};

export default async function TutorPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const result = await getEnrolledSubjectsAction();

  if (result.error !== null || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-destructive text-2xl font-bold">
            حدث خطأ أثناء تحميل المواد
          </h1>
        </div>
      </div>
    );
  }

  return <TutorClient subjects={result.data} />;
}
