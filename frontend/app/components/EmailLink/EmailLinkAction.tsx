"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { fetchJson } from "@/app/lib/api/fetchJson";

const API = process.env.NEXT_PUBLIC_API_BACK_END;
const INVALID_LINK = "Lien invalide ou expiré.";

interface EmailLinkActionProps {
  /** API route that receives the link's token. */
  path: string;
  title: string;
  intro: string;
  actionLabel: string;
  successTitle: string;
  successText: string;
}

/**
 * The page behind a link sent by email. It acts on a click, not on load: mail
 * security scanners open links by themselves, and must not confirm an address
 * or turn alerts off in the user's place.
 */
export default function EmailLinkAction({
  path,
  title,
  intro,
  actionLabel,
  successTitle,
  successText,
}: Readonly<EmailLinkActionProps>) {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(token ? null : INVALID_LINK);

  const run = async () => {
    setState("sending");
    setError(null);
    try {
      await fetchJson(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };

  const done = state === "done";

  return (
    <main className="mx-auto max-w-[640px] px-5 pt-11 pb-16 lg:pt-[72px] lg:pb-24">
      <h1 className="m-0 text-[28px] leading-[1.15] lg:text-[36px]">
        {done ? successTitle : title}
      </h1>
      <p className="mt-4 mb-6 text-[15px] leading-7 text-(--n-neutral-300)">
        {done ? successText : intro}
      </p>
      {done ? (
        <Link href="/alertes" className="n-btn n-btn-primary inline-flex">
          Voir mes alertes
        </Link>
      ) : (
        <button
          type="button"
          className="n-btn n-btn-primary"
          disabled={!token || state === "sending"}
          onClick={run}
        >
          {state === "sending" ? "Un instant…" : actionLabel}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-4 mb-0 text-sm text-(--n-down)">
          {error}
        </p>
      )}
    </main>
  );
}
