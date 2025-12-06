import { ResetPasswordForm } from "@/components/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ token: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const token = (await searchParams).token;

  if (!token) redirect("/auth/login");

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
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
