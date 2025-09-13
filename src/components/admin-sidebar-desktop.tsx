"use client";

import { cn } from "@/lib/utils";
import { AdminSidebarContent } from "./admin-sidebar-content";

export default function AdminSidebarDesktop({
  className,
}: {
  className?: string;
}) {
  return (
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
  );
}
