import Link from "next/link";
import type { Article } from "@/app/(public)/blog/data";
import { CategoryBadge } from "../CategoryBadge/CategoryBadge";

export function SmallCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/blog/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card border border-surface hover:border-primary/30 transition-colors"
    >
      <div
        className={`h-32 bg-gradient-to-br ${article.gradient} relative shrink-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <CategoryBadge category={article.category} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-black">
            {article.authorInitial}
          </div>
          <span className="text-xs text-muted">{article.author}</span>
          <span className="text-muted/40 text-xs">·</span>
          <span className="text-xs text-muted">{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
