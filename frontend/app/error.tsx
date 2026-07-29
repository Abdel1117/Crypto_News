"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SpecialPageIcon } from "./components/Icons/SpecialPageIcon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-primary">
        <SpecialPageIcon width={36} height={36} />
      </div>

      <h1 className="mt-8 text-6xl font-semibold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent sm:text-7xl">
        Oups
      </h1>
      <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
        Une erreur est survenue
      </h2>
      <p className="mt-3 max-w-md text-base text-muted">
        Quelque chose s&apos;est mal passé de notre côté. Vous pouvez réessayer
        ou revenir à l&apos;accueil.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 hover:cursor-pointer"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded bg-card px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
