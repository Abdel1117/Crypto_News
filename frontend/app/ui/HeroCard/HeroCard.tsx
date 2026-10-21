import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CategoryBadge, categoryStyle } from "../CategoryBadge/CategoryBadge";
import { AuthorChip } from "../AuthorChip/AuthorChip";

/** Large cover card for the featured article. */
export function HeroCard({
  article,
  className = "",
  showExcerpt = false,
}: {
  article: Article;
  className?: string;
  showExcerpt?: boolean;
}) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className={`group relative overflow-hidden rounded-[14px] flex flex-col justify-end no-underline n-cover ${className}`}
      style={categoryStyle(article.category)}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
      />
      <div className="relative flex flex-col gap-2.5 p-5 lg:p-7">
        <CategoryBadge category={article.category} onCover />
        <h3 className="m-0 text-xl lg:text-[28px] leading-tight text-white group-hover:underline decoration-1 underline-offset-4">
          {article.title}
        </h3>
        {showExcerpt && (
          <p className="m-0 max-w-[60ch] text-sm lg:text-[15px] leading-relaxed text-white/70 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <AuthorChip
          initial={article.authorInitial}
          name={article.author}
          readTime={article.readTime}
          onCover
        />
      </div>
    </Link>
  );
}
