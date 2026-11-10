"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import { isEditorial } from "@/app/lib/auth/roles";
import { loginHref } from "@/app/lib/auth/redirect";
import {
  COMMENT_MAX,
  deleteComment,
  fetchComments,
  postComment,
  type BlogComment,
  type CommentsPage,
} from "@/app/lib/api/blog";
import { formatRelative, initialOf } from "./format";
import { TrashIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: Readonly<{
  comment: BlogComment;
  canDelete: boolean;
  onDelete: (comment: BlogComment) => void;
}>) {
  return (
    <li className="flex gap-3 py-4 relative">
      <div className="n-rule" />
      <span
        aria-hidden="true"
        className="w-8 h-8 flex-none rounded-full grid place-items-center text-xs font-medium bg-(--n-accent-800) text-(--n-accent-100)"
      >
        {initialOf(comment.author_name)}
      </span>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium">{comment.author_name}</span>
          <span className="text-(--n-neutral-500)">
            <time dateTime={comment.created_at}>
              {formatRelative(comment.created_at)}
            </time>
          </span>
          {canDelete && (
            <button
              type="button"
              className="n-btn n-btn-icon w-9! h-9! ml-auto text-(--n-neutral-500) hover:text-(--n-down)!"
              aria-label={`Supprimer le commentaire de ${comment.author_name}`}
              onClick={() => onDelete(comment)}
            >
              <TrashIcon size={15} />
            </button>
          )}
        </div>
        <p className="m-0 text-[15px] leading-relaxed whitespace-pre-line break-words">
          {comment.body}
        </p>
      </div>
    </li>
  );
}

function CommentForm({
  onSubmit,
}: Readonly<{ onSubmit: (body: string) => Promise<boolean> }>) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const trimmed = body.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || sending) return;
    setSending(true);
    if (await onSubmit(trimmed)) setBody("");
    setSending(false);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <div className="n-field">
        <label htmlFor="comment-body">Votre commentaire</label>
        <textarea
          id="comment-body"
          className="n-text-input min-h-24! py-2.5! resize-y"
          maxLength={COMMENT_MAX}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Partagez votre avis…"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-(--n-neutral-500) n-tnum">
          {body.length} / {COMMENT_MAX}
        </span>
        <button
          type="submit"
          className="n-btn n-btn-primary min-h-11 lg:min-h-10"
          disabled={!trimmed || sending}
        >
          {sending ? "Envoi…" : "Publier"}
        </button>
      </div>
    </form>
  );
}

/** The article's comments: newest first, and a form for logged-in readers. */
export default function Comments({
  articleId,
  slug,
}: Readonly<{ articleId: number; slug: string }>) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const tools = useAuthTools();
  const [items, setItems] = useState<BlogComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const showPage = useCallback((page: CommentsPage, offset: number) => {
    // A comment posted meanwhile shifts the pages: skip the ones already shown.
    setItems((prev) => {
      if (offset === 0) return page.items;
      const shown = new Set(prev.map((c) => c.id));
      return [...prev, ...page.items.filter((c) => !shown.has(c.id))];
    });
    setTotal(page.total);
    setError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchComments(articleId, 0)
      .then((page) => {
        if (!cancelled) showPage(page, 0);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les commentaires.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, showPage]);

  const loadMore = async () => {
    const offset = items.length;
    setLoading(true);
    try {
      showPage(await fetchComments(articleId, offset), offset);
    } catch {
      setError("Impossible de charger les commentaires.");
    } finally {
      setLoading(false);
    }
  };

  const add = async (body: string) => {
    try {
      const comment = await postComment(articleId, body, tools);
      setItems((prev) => [comment, ...prev]);
      setTotal((n) => n + 1);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commentaire non envoyé.");
      return false;
    }
  };

  const remove = async (comment: BlogComment) => {
    if (!globalThis.confirm("Supprimer ce commentaire ?")) return;
    try {
      await deleteComment(comment.id, tools);
      setItems((prev) => prev.filter((c) => c.id !== comment.id));
      setTotal((n) => n - 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    }
  };

  const canDelete = (comment: BlogComment) =>
    !!user && (String(comment.user_id) === user.id || isEditorial(user.role));

  return (
    <section aria-labelledby="comments-title" className="flex flex-col gap-5">
      <h2 id="comments-title" className="m-0 text-xl flex items-baseline gap-2.5">
        Commentaires
        <span className="text-[13px] text-(--n-neutral-500) n-tnum">{total}</span>
      </h2>

      {isAuthenticated ? (
        <CommentForm onSubmit={add} />
      ) : (
        <p className="m-0 text-[15px] text-(--n-neutral-400)">
          <Link href={loginHref(`/blog/${slug}`)}>Connectez-vous</Link> pour
          participer à la discussion.
        </p>
      )}

      {error && (
        <p role="alert" className="n-field-error m-0!">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="list-none m-0 p-0">
          {items.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              canDelete={canDelete(c)}
              onDelete={remove}
            />
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="m-0 text-sm text-(--n-neutral-500)">
          Aucun commentaire pour l’instant. Soyez le premier !
        </p>
      )}

      {loading && (
        <div className="n-skeleton h-16" aria-busy="true" aria-label="Chargement des commentaires" />
      )}

      {!loading && items.length < total && (
        <button
          type="button"
          className="n-btn n-btn-secondary self-start min-h-10"
          onClick={loadMore}
        >
          Charger plus
        </button>
      )}
    </section>
  );
}
