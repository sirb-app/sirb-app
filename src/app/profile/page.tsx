import { ChangePasswordForm } from "@/components/change-password-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { Lock, LogOut, Shield } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditableAvatar } from "./_components/editable-avatar";
import { EditableNameField } from "./_components/editable-name-field";

export const metadata: Metadata = {
  title: "الملف الشخصي | سرب",
  description: "إدارة ملفك الشخصي وإعداداتك في منصة سرب",
};

export default async function Page() {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) redirect("/auth/login");

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8 md:py-12">
      {/* Single Unified Card */}
      <Card>
        <CardContent className="space-y-6 p-8 md:p-10">
          {/* Avatar & Name Section */}
          <div className="flex flex-col items-center gap-4 text-center">
            <EditableAvatar
              currentImage={session.user.image || null}
              userName={session.user.name}
              publicUrlBase={process.env.CLOUDFLARE_R2_PUBLIC_URL!}
            />

            <div className="space-y-2">
              <EditableNameField initialName={session.user.name} />

              <p className="text-muted-foreground text-sm">
                {session.user.email}
              </p>

              {session.user.role === "ADMIN" && (
                <Badge variant="default" className="gap-2">
                  <Shield className="h-3 w-3" />
                  مشرف
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Change Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="text-muted-foreground h-5 w-5" />
              <h3 className="text-lg font-semibold">تغيير كلمة المرور</h3>
            </div>
            <ChangePasswordForm />
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            {session.user.role === "ADMIN" && (
              <Button asChild className="w-full">
                <Link href="/admin/dashboard">
                  <Shield className="ml-2 h-4 w-4" />
                  لوحة الإشراف
                </Link>
              </Button>
            )}

            <SignOutButton variant="destructive" className="w-full">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
