"use client";

import RoleGuard from "@/app/components/AuthGuard/RoleGuard";
import ArticleEditor from "@/app/components/Redaction/ArticleEditor";
import { EDITORIAL_ROLES } from "@/app/lib/auth/roles";

export default function NewArticlePage() {
  return (
    <RoleGuard roles={EDITORIAL_ROLES}>
      <ArticleEditor />
    </RoleGuard>
  );
}
