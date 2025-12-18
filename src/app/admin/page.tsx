import { redirect } from "next/navigation";

// TODO: Implement proper dashboard with KPIs and platform health metrics
// For now, redirect to reports page
export default function AdminDashboardPage() {
  redirect("/admin/reports");
}
