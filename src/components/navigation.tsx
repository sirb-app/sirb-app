"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BookOpen, Home, LogIn, Menu, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "الرئيسية",
    path: "/",
    icon: Home,
  },
  {
    label: "المقررات",
    path: "/subjects",
    icon: BookOpen,
  },
  {
    label: "من نحن",
    path: "/about",
    icon: Users,
  },
];

export const Navigation = () => {
  const activePathname = usePathname();

  return (
    <nav className="sticky top-4 z-50 w-full">
      <div className="mx-auto max-w-[1200px] px-3 md:px-8 lg:px-[150px]">
        <div className="bg-card rounded-lg border px-4 py-3 shadow-md md:px-6 md:py-4">
          <div className="flex flex-row-reverse items-center justify-between md:flex-row">
            {/* Logo - Left side on desktop, right side on mobile */}
            <Link href="/" className="text-foreground text-xl font-bold">
              سرب
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden items-center gap-6 md:flex">
              {routes.map(route => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={cn(
                    "text-muted-foreground hover:text-foreground text-sm font-medium transition-colors",
                    {
                      "text-foreground": route.path === activePathname,
                    }
                  )}
                >
                  {route.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons - Right side on desktop, left side on mobile */}
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">إنشاء حساب</Button>
              </Link>
            </div>

            {/* Mobile Menu Button - Right side on mobile, hidden on desktop */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="pb-6">
                  <SheetTitle className="text-foreground text-xl font-bold">
                    القائمة الرئيسية
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6">
                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
                      التنقل
                    </h3>
                    {routes.map(route => {
                      const Icon = route.icon;
                      return (
                        <Link
                          key={route.path}
                          href={route.path}
                          className={cn(
                            "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                            {
                              "border-primary bg-primary/10 text-primary border-r-2":
                                route.path === activePathname,
                            }
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {route.label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="border-border flex flex-col gap-3 border-t pt-6">
                    <h3 className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
                      الحساب
                    </h3>
                    <div className="flex flex-col gap-2 px-3">
                      <Link href="/auth/login">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-3"
                        >
                          <LogIn className="h-4 w-4" />
                          تسجيل الدخول
                        </Button>
                      </Link>
                      <Link href="/auth/register">
                        <Button
                          size="sm"
                          className="w-full justify-start gap-3"
                        >
                          <UserPlus className="h-4 w-4" />
                          إنشاء حساب
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
