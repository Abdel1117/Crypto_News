"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import { fetchRecommendations, type ArticleSummary } from "@/app/lib/api/blog";
import { SmallCard } from "@/app/ui/SmallCard/SmallCard";
import { SectionHeader } from "@/app/ui/SectionHeader/SectionHeader";

/**
 * « Pour vous »: articles picked from the categories the reader liked or
 * saved. Logged-out readers (and failures) see nothing.
 */
export default function ForYouRow() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const tools = useAuthTools();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchRecommendations(tools)
      .then((items) => {
        if (!cancelled) setArticles(items);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, tools]);

  if (!isAuthenticated || articles.length === 0) return null;

  return (
    <section className="mt-12 lg:mt-16" aria-label="Pour vous">
      <SectionHeader title="Pour vous" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((a) => (
          <SmallCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
