"use client";

import AdminSidebarDesktop from "./admin-sidebar-desktop";
import AdminSidebarMobile from "./admin-sidebar-mobile";
export { AdminSidebarContent } from "./admin-sidebar-content";

export default function AdminSidebar({ className }: { className?: string }) {
  return (
    <>
      <AdminSidebarMobile />
      <AdminSidebarDesktop className={className} />
    </>
  );
}
