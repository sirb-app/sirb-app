import AdminSidebar from "@/components/admin-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    notFound();
  }
  return (
    <div
      className="bg-background text-foreground flex min-h-dvh w-full"
      dir="rtl"
    >
      <AdminSidebar />
      <main className="flex-1 p-4 md:mr-64 md:p-6">{children}</main>
    </div>
  );
}
