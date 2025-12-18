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
        "bg-sidebar fixed top-20 right-0 z-40 hidden h-[calc(100dvh-5rem)] w-64 flex-col gap-2 overflow-y-auto border-l p-3 text-right md:flex",
        className
      )}
      dir="rtl"
      aria-label="الشريط الجانبي للإدارة"
    >
      <AdminSidebarContent showHeader />
    </aside>
  );
}
