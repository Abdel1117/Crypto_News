import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CATEGORY_META } from "@/app/(public)/blog/data";

export function ListCard({
  article,
  index,
}: {
  article: Article;
  index: number;
}) {
  const meta = CATEGORY_META[article.category];
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group flex gap-3 items-start pb-3 border-b border-surface last:border-0 hover:opacity-80 transition-opacity"
    >
      <div
        className={`w-24 h-24 rounded-lg bg-gradient-to-br ${article.gradient} shrink-0 flex items-center justify-center`}
      >
        <span className="text-white/60 text-xl font-bold">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${meta?.color ?? "text-primary"}`}
        >
          {article.category}
        </span>
        <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
          {article.title}
        </h4>
        <span className="text-xs text-muted mt-1 block">
          {article.readTime} · {article.date}
        </span>
      </div>
    </Link>
  );
}
