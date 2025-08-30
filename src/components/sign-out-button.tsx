"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type SignOutButtonProps = {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
};

export const SignOutButton = ({
  variant = "destructive",
  size = "sm",
  className,
  children = "تسجيل الخروج",
}: SignOutButtonProps) => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    await signOut({
      fetchOptions: {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: ctx => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("You've logged out. See you soon!");
          router.push("/auth/login");
        },
      },
    });
  }

  return (
    <Button
      onClick={handleClick}
      size={size}
      variant={variant}
      disabled={isPending}
      className={className}
    >
      {children}
    </Button>
  );
};
