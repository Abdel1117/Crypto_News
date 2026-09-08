import type { Metadata } from "next";
import React from "react";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default function page() {
  return (
    <AuthGuard>
      <div>Settings</div>
    </AuthGuard>
  );
}
