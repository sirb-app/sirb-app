"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { BookOpen, FileText, Flag, Users } from "lucide-react";
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
  // TODO: Dashboard page - implement with KPIs and platform health metrics
  // const overview: NavItem[] = [
  //   {
  //     label: "لوحة التحكم",
  //     href: "/admin",
  //     exact: true,
  //     icon: LayoutDashboard,
  //   },
  // ];

  const moderation: NavItem[] = [
    { label: "إدارة المحتوى", href: "/admin/content", icon: FileText },
    { label: "البلاغات", href: "/admin/reports", icon: Flag },
  ];

  const platform: NavItem[] = [
    { label: "إدارة الجامعات", href: "/admin/universities", icon: BookOpen },
    { label: "إدارة المستخدمين", href: "/admin/users", icon: Users },
    // TODO: Analytics page - implement with charts and statistics
    // { label: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <>
      {showHeader && (
        <div className="border-border border-b px-3 pt-4 pb-3">
          <div className="text-foreground text-xl font-bold">لوحة الإدارة</div>
        </div>
      )}
      <nav
        className="flex-1 overflow-y-auto pr-1"
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* TODO: Re-enable when Dashboard is implemented
        <NavSection title="نظرة عامة">
          {overview.map(item => (
            <NavLink key={item.href} item={item} wrap={linkWrapper} />
          ))}
        </NavSection>
        <div className="border-border my-2 border-t" />
        */}
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
