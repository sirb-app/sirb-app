"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useModerationAccess } from "@/hooks/use-moderation-access";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ModeToggle } from "./mode-toggle";
import { SignOutButton } from "./sign-out-button";

const routes = [
  { label: "الرئيسية", path: "/", icon: BookOpen },
  { label: "المقررات", path: "/subjects", icon: BookOpen },
  { label: "من نحن", path: "/team", icon: Users },
];

type User = {
  id: string;
  name: string;
  image?: string | null;
  role?: string;
} | null;

type NavigationMobileProps = {
  user: User;
  isPending: boolean;
};

export const NavigationMobile = ({
  user,
  isPending,
}: NavigationMobileProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activePathname = usePathname();
  const hasModerationAccess = useModerationAccess(user);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild className="md:hidden">
        {!mounted || isPending ? (
          <Button variant="ghost" size="sm" disabled>
            <Skeleton className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-foreground text-xl font-bold">
            القائمة الرئيسية
          </SheetTitle>
          {user && (
            <p className="text-muted-foreground text-sm">أهلا {user.name}</p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
              التنقل
            </h3>
            {routes.map(route => {
              const Icon = route.icon;
              const isActive =
                route.path === "/"
                  ? activePathname === "/"
                  : activePathname?.startsWith(route.path);
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  onClick={() => setIsSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {route.label}
                </Link>
              );
            })}
          </div>

          <div className="border-border flex flex-col gap-3 border-t pt-6">
            <h3 className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
              الحساب
            </h3>
            <div className="flex flex-col gap-2 px-3">
              {!mounted || isPending ? (
                <>
                  <div className="text-muted-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsSheetOpen(false)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>مقرراتي</span>
                  </Link>
                  {hasModerationAccess && (
                    <Link
                      href="/moderation"
                      onClick={() => setIsSheetOpen(false)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                    >
                      <Shield className="h-4 w-4" />
                      <span>الإشراف</span>
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsSheetOpen(false)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      <span>لوحة الإدارة</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsSheetOpen(false)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  >
                    <Users className="h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                  <div
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <SignOutButton
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>تسجيل الخروج</span>
                    </SignOutButton>
                  </div>
                </>
              ) : (
                <>
                  <div onClick={() => setIsSheetOpen(false)}>
                    <Link
                      href="/auth/login"
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>تسجيل الدخول</span>
                    </Link>
                  </div>
                  <div onClick={() => setIsSheetOpen(false)}>
                    <Link
                      href="/auth/register"
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>إنشاء حساب</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="border-border flex flex-col gap-3 border-t pt-6">
            <h3 className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
              المظهر
            </h3>
            <div className="px-3">
              <ModeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
