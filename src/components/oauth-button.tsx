"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { SiGithub, SiGoogle } from "react-icons/si";
import { toast } from "sonner";

type OAuthButtonProps = {
  provider: "google" | "github";
};

export const OAuthButton = ({ provider }: OAuthButtonProps) => {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    await signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/auth/login/error",
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
      },
    });
  }

  const providerName = provider === "google" ? "Google" : "GitHub";

  return (
    <Button
      variant="outline"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : provider === "google" ? (
        <SiGoogle className="h-4 w-4" />
      ) : (
        <SiGithub className="h-4 w-4" />
      )}
      <span>{providerName}</span>
    </Button>
  );
};
