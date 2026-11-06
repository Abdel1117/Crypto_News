import type { Metadata } from "next";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";
import AlertsPanel from "@/app/components/Alerts/AlertsPanel";

export const metadata: Metadata = {
  title: "Alertes de prix",
  robots: { index: false, follow: false },
};

export default function AlertsPage() {
  return (
    <AuthGuard>
      <AlertsPanel />
    </AuthGuard>
  );
}
