"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  FileText,
  Flag,
  LayoutDashboard,
  PanelRightOpen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, ReactElement } from "react";

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
  icon?: LucideIcon;
};

type NavSectionProps = PropsWithChildren<{
  title: string;
}>;

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="mb-4">
      <div className="text-muted-foreground px-3 text-sm font-medium tracking-wide uppercase">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function useIsActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  const normalize = (p: string) =>
    p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  const current = normalize(pathname || "/");
  const target = normalize(href);
  if (exact) return current === target;
  return current === target || current.startsWith(target + "/");
}

function NavLink({
  item,
  wrap,
}: {
  item: NavItem;
  wrap?: (node: ReactElement) => ReactElement;
}) {
  const active = useIsActive(item.href, item.exact);
  const linkEl = (
    <Link
      href={item.href}
      className={cn(
        "focus-visible:ring-ring flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2",
        active
          ? "border-primary bg-primary/10 text-primary border-r-2"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {item.icon ? <item.icon className="h-5 w-5" /> : null}
      {item.label}
    </Link>
  );
  return wrap ? wrap(linkEl) : linkEl;
}

export function AdminSidebarContent({
  linkWrapper,
  showHeader = true,
}: {
  linkWrapper?: (node: ReactElement) => ReactElement;
  showHeader?: boolean;
}) {
  const overview: NavItem[] = [
    {
      label: "لوحة التحكم",
      href: "/admin",
      exact: true,
      icon: LayoutDashboard,
    },
  ];

  const moderation: NavItem[] = [
    { label: "إدارة المحتوى", href: "/admin/content", icon: FileText },
    { label: "البلاغات", href: "/admin/reports", icon: Flag },
  ];

  const platform: NavItem[] = [
    { label: "إدارة الجامعات", href: "/admin/universities", icon: BookOpen },
    { label: "إدارة المستخدمين", href: "/admin/users", icon: Users },
    { label: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <>
      {showHeader && (
        <div className="border-border border-b px-3 pt-4 pb-3">
          <div className="text-foreground text-xl font-bold">لوحة الإدارة</div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto pr-1" role="navigation">
        <NavSection title="نظرة عامة">
          {overview.map(item => (
            <NavLink key={item.href} item={item} wrap={linkWrapper} />
          ))}
        </NavSection>
        <div className="border-border my-2 border-t" />
        <NavSection title="الإشراف">
          {moderation.map(item => (
            <NavLink key={item.href} item={item} wrap={linkWrapper} />
          ))}
        </NavSection>
        <div className="border-border my-2 border-t" />
        <NavSection title="المنصة">
          {platform.map(item => (
            <NavLink key={item.href} item={item} wrap={linkWrapper} />
          ))}
        </NavSection>
      </nav>
    </>
  );
}

export default function AdminSidebar({ className }: { className?: string }) {
  return (
    <>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="secondary"
              size="icon"
              className="fixed right-4 bottom-5 z-50 rounded-full shadow-md"
              aria-label="فتح القائمة الجانبية"
            >
              <PanelRightOpen className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-sidebar w-[300px] p-0 sm:w-[400px]"
          >
            <SheetHeader className="pt-3 pr-4 pb-4">
              <SheetTitle className="text-foreground text-xl font-bold">
                لوحة الإدارة
              </SheetTitle>
            </SheetHeader>
            <div
              className="flex h-full flex-col gap-2 text-right"
              dir="rtl"
              aria-label="الشريط الجانبي للإدارة"
            >
              <AdminSidebarContent
                linkWrapper={node => <SheetClose asChild>{node}</SheetClose>}
                showHeader={false}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside
        className={cn(
          "bg-sidebar fixed top-0 right-0 z-50 hidden h-dvh w-64 flex-col gap-2 overflow-y-auto border-l p-3 text-right md:flex",
          className
        )}
        dir="rtl"
        aria-label="الشريط الجانبي للإدارة"
      >
        <AdminSidebarContent showHeader />
      </aside>
    </>
  );
}
