import type { Metadata } from "next";
import Link from "next/link";
import FavoritesList from "@/app/components/Blog/FavoritesList";
import { ArrowLeftIcon } from "@/app/ui/NocturneIcons/NocturneIcons";

export const metadata: Metadata = {
  title: "Mes articles favoris",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 pt-6 pb-16 lg:px-[120px] lg:pt-10 lg:pb-24">
      <Link href="/blog" className="n-link-arrow text-(--n-neutral-400)!">
        <ArrowLeftIcon size={16} />
        Tous les articles
      </Link>
      <header className="mt-4 mb-8 lg:mb-10">
        <span className="n-eyebrow">Blog</span>
        <h1 className="mt-3.5 mb-0 text-[32px] leading-[1.1] lg:mt-4 lg:text-[44px]">
          Mes favoris
        </h1>
      </header>
      <FavoritesList />
    </main>
  );
}
