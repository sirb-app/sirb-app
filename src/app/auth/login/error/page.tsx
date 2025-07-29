import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ error: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="px-8 py-16 container mx-auto max-w-screen-lg space-y-8">
      <div className="space-y-4">
        <Button size="icon" asChild>
          <Link href="/auth/login">
            <ArrowLeftIcon />
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Login Error</h1>
      </div>

      <p className="text-destructive">
        {sp.error === "account_not_linked"
          ? "This account is already linked to another sign-in method."
          : "Oops! Something went wrong. Please try again."}
      </p>
    </div>
  );
}
