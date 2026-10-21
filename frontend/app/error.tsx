"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusScreen } from "./ui/StatusScreen/StatusScreen";
import { ArrowsClockwiseIcon } from "./ui/NocturneIcons/NocturneIcons";

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
    <StatusScreen
      code="Oups"
      title="Une erreur est survenue"
      actions={
        <>
          <button
            type="button"
            onClick={() => reset()}
            className="n-btn n-btn-primary n-btn-lg min-h-12 sm:min-h-0"
          >
            <ArrowsClockwiseIcon />
            Réessayer
          </button>
          <Link
            href="/"
            className="n-btn n-btn-secondary n-btn-lg min-h-12 sm:min-h-0"
          >
            Retour à l’accueil
          </Link>
        </>
      }
    >
      Quelque chose s’est mal passé de notre côté. Vous pouvez réessayer ou
      revenir à l’accueil.
    </StatusScreen>
  );
}
