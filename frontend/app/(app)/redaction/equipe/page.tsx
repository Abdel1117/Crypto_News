"use client";

import RoleGuard from "@/app/components/AuthGuard/RoleGuard";
import TeamManager from "@/app/components/Redaction/TeamManager";

export default function TeamPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <TeamManager />
    </RoleGuard>
  );
}
