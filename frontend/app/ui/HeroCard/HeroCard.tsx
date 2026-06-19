import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CategoryBadge } from "../CategoryBadge/CategoryBadge";
import { AuthorChip } from "../AuthorChip/AuthorChip";

export function HeroCard({
  article,
  className = "",
}: {
  article: Article;
  className?: string;
}) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className={`group relative overflow-hidden rounded-2xl flex flex-col justify-end ${className}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${article.gradient}`}
      />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10 p-5">
        <CategoryBadge category={article.category} />
        <h3 className="mt-2 text-sm text-white font-bold leading-snug group-hover:text-primary transition-colors line-clamp-3">
          {article.title}
        </h3>
        <AuthorChip
          initial={article.authorInitial}
          name={article.author}
          date={article.date}
          readTime={article.readTime}
        />
      </div>
    </Link>
  );
}
