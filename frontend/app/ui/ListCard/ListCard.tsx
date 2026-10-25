import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CategoryBadge, categoryStyle } from "../CategoryBadge/CategoryBadge";

/** Compact numbered row (side list next to the featured article). */
export function ListCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group flex gap-3.5 items-start py-3.5 no-underline text-(--n-text)!"
    >
      <span
        aria-hidden="true"
        className="n-cover w-16 h-16 flex-none rounded-lg grid place-items-center text-lg font-medium text-white/80 n-tnum"
        style={categoryStyle(article.category)}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="flex flex-col gap-1 min-w-0">
        <CategoryBadge category={article.category} />
        <span className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-(--n-accent)">
          {article.title}
        </span>
        <span className="text-xs text-(--n-neutral-500)">
          {article.readTime} · {article.date}
        </span>
      </span>
    </Link>
  );
}
