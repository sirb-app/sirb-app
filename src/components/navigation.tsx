"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { NavigationDesktop, NavigationDesktopAuth } from "./navigation-desktop";
import { NavigationMobile } from "./navigation-mobile";

export const Navigation = () => {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Background mask to hide content scrolling behind nav */}
      <div className="sticky top-0 h-4 w-full">
        <div className="bg-background absolute inset-0 -z-10" />
      </div>
      <nav className="pointer-events-none sticky top-4 isolate z-50 w-full">
        <div className="mx-auto max-w-[1200px] px-3 md:px-8 lg:px-[150px]">
          <div className="bg-card pointer-events-auto rounded-lg border px-4 py-3 shadow-md md:px-6 md:py-4">
            <div className="flex flex-row-reverse items-center justify-between md:flex-row">
              {/* Logo */}
              <Link href="/" className="text-foreground text-xl font-bold">
                سرب
              </Link>

              {/* Desktop Navigation */}
              <NavigationDesktop />

              {/* Desktop Right Side */}
              <NavigationDesktopAuth user={user} isPending={isPending} />

              {/* Mobile Menu */}
              <NavigationMobile user={user} isPending={isPending} />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
