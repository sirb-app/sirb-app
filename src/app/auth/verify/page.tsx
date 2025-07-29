import { SendVerificationEmailForm } from "@/components/send-verification-email-form";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ error: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const error = (await searchParams).error;

  if (!error) redirect("/profile");

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <Button size="icon" asChild>
          <Link href="/auth/login">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Verify Email</h1>
      </div>

      <p className="text-destructive">
        <span className="capitalize">
          {error.replace(/_/g, " ").replace(/-/g, " ")}
        </span>{" "}
        - Please request a new verification email.
      </p>

      <SendVerificationEmailForm />
    </div>
  );
}
