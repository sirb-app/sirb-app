"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useModerationAccess } from "@/hooks/use-moderation-access";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown, LogOut, Settings, Shield, Users } from "lucide-react";
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

type NavigationDesktopAuthProps = {
  user: User;
  isPending: boolean;
};

export const NavigationDesktop = () => {
  const activePathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return activePathname === "/";
    return activePathname?.startsWith(path);
  };

  return (
    <div className="hidden items-center gap-6 md:flex">
      {routes.map(route => (
        <Link
          key={route.path}
          href={route.path}
          className={cn(
            "relative py-1 text-sm font-medium transition-colors",
            isActive(route.path)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {route.label}
          {isActive(route.path) && (
            <span className="bg-primary absolute right-0 -bottom-1 left-0 h-0.5 rounded-full" />
          )}
        </Link>
      ))}
    </div>
  );
};

export const NavigationDesktopAuth = ({
  user,
  isPending,
}: NavigationDesktopAuthProps) => {
  const hasModerationAccess = useModerationAccess(user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="hidden items-center gap-3 md:flex">
      <ModeToggle />
      {!mounted || isPending ? (
        <>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </>
      ) : user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex w-[72px] items-center gap-2 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} alt={user.name} />
                <AvatarFallback className="text-xs uppercase">
                  {user.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mt-4 w-56" align="start">
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex flex-row-reverse items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>مقرراتي</span>
              </Link>
            </DropdownMenuItem>
            {hasModerationAccess && (
              <DropdownMenuItem asChild>
                <Link
                  href="/moderation"
                  className="flex flex-row-reverse items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>الإشراف</span>
                </Link>
              </DropdownMenuItem>
            )}
            {user.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="flex flex-row-reverse items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>لوحة الإدارة</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex flex-row-reverse items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>الملف الشخصي</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <SignOutButton
                variant="ghost"
                size="sm"
                className="text-destructive focus:text-destructive flex w-full flex-row-reverse items-center justify-start gap-2"
              >
                <LogOut className="text-destructive h-4 w-4" />
                <span>تسجيل الخروج</span>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              تسجيل الدخول
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">إنشاء حساب</Button>
          </Link>
        </>
      )}
    </div>
  );
};
