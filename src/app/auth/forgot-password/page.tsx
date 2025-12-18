import { ForgotPasswordForm } from "@/components/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور | سرب",
  description: "استعادة كلمة المرور لحسابك في منصة سرب",
};

export default function Page() {
  return (
    <div className="bg-muted/40 -mt-24 flex min-h-svh flex-col items-center gap-6 p-6 pt-44 md:p-10 md:pt-48">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">نسيت كلمة المرور</CardTitle>
            <CardDescription>
              أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
