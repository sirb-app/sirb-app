import { RegisterForm } from "@/components/register-form";
import { SignInOauthButton } from "@/components/sign-in-oauth-button";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container mx-auto max-w-screen-lg space-y-8 px-8 py-16">
      <div className="space-y-4">
        <Button size="icon" asChild>
          <Link href="/">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Register</h1>
      </div>

      <div className="space-y-4">
        <RegisterForm />

        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="hover:text-foreground">
            Login
          </Link>
        </p>

        <hr className="max-w-sm" />
      </div>

      <div className="flex max-w-sm flex-col gap-4">
        <SignInOauthButton signUp provider="google" />
        <SignInOauthButton signUp provider="github" />
      </div>
    </div>
  );
}
