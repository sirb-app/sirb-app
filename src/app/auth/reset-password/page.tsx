import { ResetPasswordForm } from "@/components/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "إعادة تعيين كلمة المرور | سرب",
  description: "قم بإعادة تعيين كلمة مرور جديدة لحسابك",
};

type PageProps = {
  searchParams: Promise<{ token: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const token = (await searchParams).token;

  if (!token) redirect("/auth/login");

  return (
    <div className="bg-muted/40 -mt-24 flex min-h-svh flex-col items-center gap-6 p-6 pt-44 md:p-10 md:pt-48">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>
              يرجى إدخال كلمة المرور الجديدة. تأكد من أنها 8 أحرف على الأقل.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
