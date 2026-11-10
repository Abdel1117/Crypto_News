import Link from "next/link";
import type { ArticleSummary } from "@/app/lib/api/blog";
import { initialOf, readTimeLabel } from "@/app/components/Blog/format";
import { CoverImage } from "@/app/components/Blog/CoverImage";
import { CategoryBadge, categoryStyle } from "../CategoryBadge/CategoryBadge";
import { AuthorChip } from "../AuthorChip/AuthorChip";

/** Article card for grids: cover, title, excerpt, author. */
export function SmallCard({
  article,
}: Readonly<{ article: ArticleSummary }>) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-(--n-surface) no-underline text-(--n-text)! transition-shadow hover:shadow-[inset_0_0_0_1px_var(--n-accent)]"
    >
      <span
        aria-hidden="true"
        className="n-cover relative h-28 flex-none overflow-hidden"
        style={categoryStyle(article.category)}
      >
        {article.cover_image && (
          <CoverImage
            image={article.cover_image}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        )}
      </span>
      <span className="flex flex-col gap-2 flex-1 p-4">
        <CategoryBadge category={article.category} />
        <span className="text-[15px] font-medium leading-snug line-clamp-2 group-hover:text-(--n-accent)">
          {article.title}
        </span>
        <span className="text-[13px] leading-relaxed text-(--n-neutral-400) line-clamp-2">
          {article.excerpt}
        </span>
        <span className="mt-auto pt-2">
          <AuthorChip
            initial={initialOf(article.author_name)}
            name={article.author_name}
            readTime={readTimeLabel(article.read_minutes)}
          />
        </span>
      </span>
    </Link>
  );
}
