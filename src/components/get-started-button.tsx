"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export const GetStartedButton = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Button size="lg" className="opacity-50" asChild>
        <span className="font-bold">إبدأ الآن</span>
      </Button>
    );
  }

  const href = session ? "/dashboard" : "/auth/login";

  return (
    <div className="flex flex-col items-center gap-4">
      <Button size="lg" asChild>
        <Link href={href}>
          <span className="font-bold">إبدأ الآن</span>
        </Link>
      </Button>

      {session && (
        <p className="flex items-center gap-2">
          <span
            data-role={session.user.role}
            className="data-[role=ADMIN]:bg-destructive data-[role=USER]:bg-primary size-4 animate-pulse rounded-full"
          />
          حياك الله, {session.user.name}! 👋
        </p>
      )}
    </div>
  );
};
