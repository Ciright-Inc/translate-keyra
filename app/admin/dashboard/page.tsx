import { DashboardView } from "@/components/admin/dashboard-view";

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="tr-page-title">Translation Analytics</h1>
      <p className="tr-page-sub">
        Live active calls, translated minutes, language usage, and confidence scoring
      </p>
      <DashboardView />
    </>
  );
}
