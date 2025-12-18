"use client";

import { useSession } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { NavigationDesktop, NavigationDesktopAuth } from "./navigation-desktop";
import { NavigationMobile } from "./navigation-mobile";

export const Navigation = () => {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  // Hide navigation on canvas pages and session pages
  const isCanvasPage = pathname?.includes("/canvases/");
  const isSessionPage = pathname?.startsWith("/sessions/");

  if (isCanvasPage || isSessionPage) {
    return null;
  }

  return (
    <>
      {/* Spacer for sticky nav positioning */}
      <div className="h-4 w-full" />
      <nav className="pointer-events-none sticky top-4 isolate z-50 w-full">
        <div className="mx-auto max-w-[1200px] px-3 md:px-8 lg:px-[150px]">
          <div className="bg-card pointer-events-auto rounded-lg border px-4 py-3 shadow-md md:px-6 md:py-4">
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              {/* Logo */}
              <Logo size="md" asLink />

              {/* Desktop Navigation */}
              <NavigationDesktop />

              {/* Desktop Right Side */}
              <NavigationDesktopAuth
                user={user ?? null}
                isPending={isPending}
              />

              {/* Mobile Menu */}
              <NavigationMobile user={user ?? null} isPending={isPending} />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
