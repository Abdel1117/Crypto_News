import type { Metadata } from "next";
import React from "react";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";
import SettingsPanel from "@/app/components/Settings/SettingsPanel";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="lg:pt-2">
        <SettingsPanel />
      </div>
    </AuthGuard>
  );
}
