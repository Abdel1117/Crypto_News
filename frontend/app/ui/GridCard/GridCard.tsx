import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CATEGORY_META } from "@/app/(public)/blog/data";

export function GridCard({ article }: { article: Article }) {
  const meta = CATEGORY_META[article.category];
  return (
    <Link href={`/blog/${article.id}`} className="group flex gap-3 items-start">
      <div
        className={`w-20 h-16 rounded-lg bg-gradient-to-br ${article.gradient} shrink-0`}
      />
      <div className="flex-1 min-w-0">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${meta?.color ?? "text-primary"}`}
        >
          {article.category}
        </span>
        <h4 className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
          {article.title}
        </h4>
        <span className="text-xs text-muted">{article.readTime}</span>
      </div>
    </Link>
  );
}
