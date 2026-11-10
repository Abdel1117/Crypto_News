"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import {
  deleteArticle,
  fetchManagedArticles,
  type ArticleStatus,
  type ArticleSummary,
} from "@/app/lib/api/blog";
import { HeaderActions } from "@/app/components/AppShell/HeaderSlots";
import { formatArticleDate } from "@/app/components/Blog/format";
import { CategoryBadge } from "@/app/ui/CategoryBadge/CategoryBadge";
import {
  ChatIcon,
  EyeIcon,
  HeartIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

type Filter = "all" | ArticleStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "published", label: "Publiés" },
];

function StatusTag({ status }: Readonly<{ status: ArticleStatus }>) {
  return status === "published" ? (
    <span className="n-tag n-tag-outline">Publié</span>
  ) : (
    <span className="n-tag n-tag-neutral">Brouillon</span>
  );
}

function ArticleRow({
  article,
  onDelete,
}: Readonly<{
  article: ArticleSummary;
  onDelete: (article: ArticleSummary) => void;
}>) {
  const published = article.status === "published";
  return (
    <li className="relative flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:gap-6 lg:px-5">
      <div className="n-rule" />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusTag status={article.status} />
          <CategoryBadge category={article.category} />
        </div>
        <Link
          href={`/redaction/${article.id}`}
          className="text-[15px] font-medium leading-snug no-underline text-(--n-text)! hover:text-(--n-accent)! line-clamp-2"
        >
          {article.title}
        </Link>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--n-neutral-500)">
          <span>{article.author_name}</span>
          <span>
            {published
              ? `Publié le ${formatArticleDate(article.published_at)}`
              : `Modifié le ${formatArticleDate(article.updated_at)}`}
          </span>
          <span className="inline-flex items-center gap-1 n-tnum">
            <HeartIcon size={12} />
            {article.like_count}
            <span className="sr-only">J’aime</span>
          </span>
          <span className="inline-flex items-center gap-1 n-tnum">
            <ChatIcon size={12} />
            {article.comment_count}
            <span className="sr-only">commentaires</span>
          </span>
        </span>
      </div>
      <div className="flex gap-1.5 flex-none">
        {published && (
          <Link
            href={`/blog/${article.slug}`}
            className="n-btn n-btn-secondary min-h-10 lg:min-h-9"
            aria-label={`Voir « ${article.title} »`}
          >
            <EyeIcon size={15} />
            Voir
          </Link>
        )}
        <Link
          href={`/redaction/${article.id}`}
          className="n-btn n-btn-secondary min-h-10 lg:min-h-9"
          aria-label={`Modifier « ${article.title} »`}
        >
          <PencilIcon size={15} />
          Modifier
        </Link>
        <button
          type="button"
          className="n-btn n-btn-secondary min-h-10 lg:min-h-9 hover:text-(--n-down)!"
          aria-label={`Supprimer « ${article.title} »`}
          onClick={() => onDelete(article)}
        >
          <TrashIcon size={15} />
          <span className="hidden sm:inline">Supprimer</span>
        </button>
      </div>
    </li>
  );
}

/** Every article (drafts included), with edit and delete, for editors and admins. */
export default function ArticleManager() {
  const tools = useAuthTools();
  const isAdmin = useAppSelector((s) => s.auth.user?.role === "admin");
  const [filter, setFilter] = useState<Filter>("all");
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchManagedArticles(tools, filter === "all" ? undefined : filter)
      .then((page) => {
        if (!cancelled) {
          setArticles(page.items);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tools, filter]);

  const remove = async (article: ArticleSummary) => {
    const ok = globalThis.confirm(
      `Supprimer « ${article.title} » ? Ses commentaires, j’aime et favoris seront supprimés aussi.`,
    );
    if (!ok) return;
    try {
      await deleteArticle(article.id, tools);
      setArticles((prev) => prev?.filter((a) => a.id !== article.id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:max-w-[1100px] lg:pt-2">
      <HeaderActions>
        {isAdmin && (
          <Link
            href="/redaction/equipe"
            className="n-btn n-btn-secondary min-h-10 lg:min-h-9 max-lg:hidden"
          >
            <UsersIcon size={15} />
            Équipe
          </Link>
        )}
        <Link
          href="/redaction/nouveau"
          className="n-btn n-btn-primary min-h-10 lg:min-h-9"
        >
          <PlusIcon size={15} />
          <span className="max-sm:hidden">Nouvel article</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </HeaderActions>

      <div className="flex flex-wrap items-center gap-3">
        <div className="n-seg" role="group" aria-label="Filtrer par statut">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="n-seg-btn px-4!"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Link href="/redaction/equipe" className="n-link-arrow lg:hidden">
            <UsersIcon size={15} />
            Gérer l’équipe
          </Link>
        )}
      </div>

      {error && (
        <p role="alert" className="n-field-error m-0!">
          {error}
        </p>
      )}

      {articles === null && !error && (
        <div className="n-skeleton h-48" aria-busy="true" aria-label="Chargement" />
      )}

      {articles?.length === 0 && (
        <div className="n-card items-start gap-2 p-6">
          <p className="m-0 text-[15px]">Aucun article ici.</p>
          <Link href="/redaction/nouveau" className="n-link-arrow">
            Écrire le premier
          </Link>
        </div>
      )}

      {articles && articles.length > 0 && (
        <ul className="n-card list-none m-0 p-0 overflow-hidden [&>li:first-child>.n-rule]:hidden">
          {articles.map((a) => (
            <ArticleRow key={a.id} article={a} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}
