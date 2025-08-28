import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container mx-auto max-w-screen-lg space-y-8 px-8 py-16">
      <div className="space-y-4">
        <Button size="icon" asChild>
          <Link href="/auth/login">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Forgot Password</h1>

        <p className="text-muted-foreground">
          Please enter your email address to receive a password reset link.
        </p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
