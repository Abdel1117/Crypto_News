"use client";

import RoleGuard from "@/app/components/AuthGuard/RoleGuard";
import ArticleManager from "@/app/components/Redaction/ArticleManager";
import { EDITORIAL_ROLES } from "@/app/lib/auth/roles";

export default function RedactionPage() {
  return (
    <RoleGuard roles={EDITORIAL_ROLES}>
      <ArticleManager />
    </RoleGuard>
  );
}
