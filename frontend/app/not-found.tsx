import Link from "next/link";
import { StatusScreen } from "./ui/StatusScreen/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title="Page introuvable"
      actions={
        <>
          <Link
            href="/"
            className="n-btn n-btn-primary n-btn-lg min-h-12 sm:min-h-0"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/dashboard"
            className="n-btn n-btn-secondary n-btn-lg min-h-12 sm:min-h-0"
          >
            Ouvrir le dashboard
          </Link>
        </>
      }
    >
      La page que vous cherchez n’existe pas ou a été déplacée.
    </StatusScreen>
  );
}
