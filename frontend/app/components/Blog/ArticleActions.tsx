"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/lib/hooks";
import { useAuthTools } from "@/app/hooks/useAuthTools";
import {
  fetchMyReactions,
  setFavorite,
  setLike,
  type ReactionState,
} from "@/app/lib/api/blog";
import { loginHref } from "@/app/lib/auth/redirect";
import {
  CheckIcon,
  HeartIcon,
  LinkIcon,
  StarIcon,
  StarOutlineIcon,
} from "@/app/ui/NocturneIcons/NocturneIcons";

const BUTTON =
  "n-btn n-btn-secondary min-h-11 lg:min-h-10 px-3.5! aria-pressed:text-(--n-accent)! aria-pressed:border-(--n-accent)!";

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(globalThis.location.href);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused (permissions): the address bar still works.
    }
  };

  return (
    <button type="button" className={BUTTON} onClick={copy}>
      {copied ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
      <span aria-live="polite">{copied ? "Lien copié" : "Copier le lien"}</span>
    </button>
  );
}

/**
 * Like, save and share an article. Logged-out readers get the same buttons,
 * leading to the login page and back here.
 */
export default function ArticleActions({
  articleId,
  slug,
  likeCount,
}: Readonly<{ articleId: number; slug: string; likeCount: number }>) {
  const { isAuthenticated, initializing } = useAppSelector((s) => s.auth);
  const tools = useAuthTools();
  const [state, setState] = useState<ReactionState>({
    liked: false,
    favorited: false,
    like_count: likeCount,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initializing || !isAuthenticated) return;
    let cancelled = false;
    fetchMyReactions(articleId, tools)
      .then((mine) => {
        if (!cancelled) setState(mine);
      })
      .catch(() => {
        // Keeps the public count: the buttons still work.
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, initializing, isAuthenticated, tools]);

  const toggle = async (kind: "like" | "favorite") => {
    if (busy) return;
    const before = state;
    const on = kind === "like" ? !state.liked : !state.favorited;
    // Optimistic: the button answers at once, the server confirms.
    setState(
      kind === "like"
        ? { ...state, liked: on, like_count: state.like_count + (on ? 1 : -1) }
        : { ...state, favorited: on },
    );
    setBusy(true);
    setError("");
    try {
      const call = kind === "like" ? setLike : setFavorite;
      setState(await call(articleId, on, tools));
    } catch (e) {
      setState(before);
      setError(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  const likeLabel = `${state.like_count} J’aime`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {isAuthenticated ? (
          <>
            <button
              type="button"
              className={BUTTON}
              aria-pressed={state.liked}
              onClick={() => toggle("like")}
            >
              <HeartIcon size={16} filled={state.liked} />
              <span className="n-tnum">{likeLabel}</span>
            </button>
            <button
              type="button"
              className={BUTTON}
              aria-pressed={state.favorited}
              onClick={() => toggle("favorite")}
            >
              {state.favorited ? (
                <StarIcon size={16} />
              ) : (
                <StarOutlineIcon size={16} />
              )}
              {state.favorited ? "Dans mes favoris" : "Ajouter aux favoris"}
            </button>
          </>
        ) : (
          <>
            <Link
              href={loginHref(`/blog/${slug}`)}
              className={BUTTON}
              aria-label={`${likeLabel} — connectez-vous pour aimer cet article`}
            >
              <HeartIcon size={16} />
              <span className="n-tnum">{likeLabel}</span>
            </Link>
            <Link href={loginHref(`/blog/${slug}`)} className={BUTTON}>
              <StarOutlineIcon size={16} />
              Ajouter aux favoris
            </Link>
          </>
        )}
        <CopyLinkButton />
      </div>
      {error && (
        <p role="alert" className="n-field-error m-0!">
          {error}
        </p>
      )}
    </div>
  );
}
