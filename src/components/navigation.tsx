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

  // Hide navigation on canvas pages, tutor pages, and session pages
  const isCanvasPage = pathname?.includes("/canvases/");
  const isTutorPage = pathname?.startsWith("/tutor");
  const isSessionPage = pathname?.startsWith("/sessions/");

  if (isCanvasPage || isTutorPage || isSessionPage) {
    return null;
  }

  return (
    <>
      {/* Background mask to hide content scrolling behind nav */}
      <div className="bg-background sticky top-0 z-40 h-4 w-full">
        <div className="mx-auto max-w-[1200px] px-3 md:px-8 lg:px-[150px]">
          <div className="h-full w-full" />
        </div>
      </div>
      <nav className="sticky top-4 z-50 w-full">
        <div className="mx-auto max-w-[1200px] px-3 md:px-8 lg:px-[150px]">
          <div className="bg-card rounded-lg border px-4 py-3 shadow-md md:px-6 md:py-4">
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
