import React from "react";
import Link from "next/link";
import { SpecialPageIcon } from "./components/Icons/SpecialPageIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card text-primary">
        <SpecialPageIcon width={36} height={36} />
      </div>

      <h1 className="mt-8 text-7xl font-semibold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent sm:text-8xl">
        404
      </h1>
      <h2 className="mt-3 text-xl font-semibold sm:text-2xl">
        Page non trouvée
      </h2>
      <p className="mt-3 max-w-md text-base text-muted">
        Désolé, la page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
