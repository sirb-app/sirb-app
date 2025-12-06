import { LoginForm } from "@/components/login-form";
import { OAuthButton } from "@/components/oauth-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">مرحباً بعودتك</CardTitle>
            <CardDescription>
              سجّل الدخول إلى حسابك للمتابعة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />

            <p className="text-muted-foreground text-center text-sm">
              ليس لديك حساب؟{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:underline font-medium"
              >
                إنشاء حساب
              </Link>
            </p>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card text-muted-foreground px-4">
                  أو المتابعة بواسطة
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <OAuthButton provider="google" />
              <OAuthButton provider="github" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
