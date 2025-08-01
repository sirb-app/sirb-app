import { LoginForm } from "@/components/login-form";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <Button size="icon" asChild>
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Login</h1>
      </div>

      <div className="space-y-4">
        <LoginForm />

        <p className="text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="hover:text-foreground">
            Register
          </Link>
        </p>

        <hr className="max-w-sm" />
      </div>

      <div className="flex flex-col max-w-sm gap-4">
        <SignInOauthButton provider="google" />
        <SignInOauthButton provider="github" />
      </div>
    </div>
  );
}
