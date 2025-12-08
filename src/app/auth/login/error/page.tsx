import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ error: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">خطأ في تسجيل الدخول</CardTitle>
            <CardDescription>
              {sp.error === "account_not_linked"
                ? "هذا الحساب مرتبط بالفعل بطريقة تسجيل دخول أخرى."
                : "عذراً! حدث خطأ ما. يرجى المحاولة مرة أخرى."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">العودة إلى تسجيل الدخول</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
