"use client";

import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";
import { isEditorial } from "@/app/lib/auth/roles";
import { StarIcon, PlusIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

/** Blog header shortcuts: saved articles, and the editors' desk for the team. */
export default function BlogReaderLinks() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-5 lg:mt-6">
      <Link href="/blog/favoris" className="n-btn n-btn-secondary min-h-10 lg:min-h-9">
        <StarIcon size={15} />
        Mes favoris
      </Link>
      {isEditorial(user?.role) && (
        <Link href="/redaction" className="n-btn n-btn-primary min-h-10 lg:min-h-9">
          <PlusIcon size={15} />
          Rédaction
        </Link>
      )}
    </div>
  );
}
