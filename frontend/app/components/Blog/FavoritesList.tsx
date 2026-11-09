"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthGuard from "@/app/components/AuthGuard/AuthGuard";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import { fetchFavorites, type ArticleSummary } from "@/app/lib/api/blog";
import { SmallCard } from "@/app/ui/SmallCard/SmallCard";

function Favorites() {
  const tools = useAuthTools();
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchFavorites(tools)
      .then((items) => {
        if (!cancelled) setArticles(items);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tools]);

  if (error) {
    return (
      <p role="alert" className="m-0 text-[15px] text-(--n-down)">
        {error}
      </p>
    );
  }
  if (articles === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Chargement">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="n-skeleton h-64" />
        ))}
      </div>
    );
  }
  if (articles.length === 0) {
    return (
      <p className="m-0 text-[15px] text-(--n-neutral-400)">
        Aucun favori pour l’instant. Ajoutez des articles depuis le{" "}
        <Link href="/blog">blog</Link> pour les retrouver ici.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {articles.map((a) => (
        <SmallCard key={a.id} article={a} />
      ))}
    </div>
  );
}

/** The reader's saved articles (logged-in only). */
export default function FavoritesList() {
  return (
    <AuthGuard>
      <Favorites />
    </AuthGuard>
  );
}
