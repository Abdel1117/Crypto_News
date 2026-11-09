"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RoleGuard from "@/app/components/AuthGuard/RoleGuard";
import ArticleEditor from "@/app/components/Redaction/ArticleEditor";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import { fetchManagedArticle, type ArticleDetail } from "@/app/lib/api/blog";
import { EDITORIAL_ROLES } from "@/app/lib/auth/roles";

function EditArticle({ id }: Readonly<{ id: number }>) {
  const tools = useAuthTools();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchManagedArticle(id, tools)
      .then((found) => {
        if (!cancelled) setArticle(found);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, tools]);

  if (error) {
    return (
      <div className="n-card items-start gap-3 p-6 max-w-[560px]">
        <p role="alert" className="m-0 text-[15px]">
          {error}
        </p>
        <Link href="/redaction" className="n-btn n-btn-secondary min-h-10">
          Retour à la rédaction
        </Link>
      </div>
    );
  }
  if (!article) {
    return <div className="n-skeleton h-[520px] lg:max-w-[880px]" aria-busy="true" aria-label="Chargement" />;
  }
  // key: a fresh editor if the id changes (e.g. right after creating).
  return <ArticleEditor key={article.id} article={article} />;
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const articleId = Number(id);

  return (
    <RoleGuard roles={EDITORIAL_ROLES}>
      {Number.isInteger(articleId) && articleId > 0 ? (
        <EditArticle id={articleId} />
      ) : (
        <p className="m-0">Article introuvable.</p>
      )}
    </RoleGuard>
  );
}
