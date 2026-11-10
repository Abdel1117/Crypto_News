import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import ArticleActions from "@/app/components/Blog/ArticleActions";
import ArticleBody from "@/app/components/Blog/ArticleBody";
import Comments from "@/app/components/Blog/Comments";
import { CoverImage } from "@/app/components/Blog/CoverImage";
import {
  formatArticleDate,
  initialOf,
  readTimeLabel,
} from "@/app/components/Blog/format";
import {
  coverUrl,
  fetchArticle,
  fetchRelatedArticles,
  type ArticleDetail,
  type ArticleSummary,
} from "@/app/lib/api/blog";
import { DEFAULT_SHARE_IMAGE } from "@/app/lib/shareImage";
import { AuthorChip } from "@/app/ui/AuthorChip/AuthorChip";
import {
  CategoryBadge,
  categoryStyle,
} from "@/app/ui/CategoryBadge/CategoryBadge";
import { ArrowLeftIcon } from "@/app/ui/NocturneIcons/NocturneIcons";
import { SectionHeader } from "@/app/ui/SectionHeader/SectionHeader";
import { SmallCard } from "@/app/ui/SmallCard/SmallCard";

// Rendered on request; the API answers are cached a minute (see lib/api/blog).
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// One API call for both the metadata and the page.
const loadArticle = cache(fetchArticle);

async function loadRelated(articleId: number): Promise<ArticleSummary[]> {
  try {
    return await fetchRelatedArticles(articleId, 3);
  } catch {
    return [];
  }
}

/** The cover for link previews (social networks), else the site's image. */
function shareImages(article: ArticleDetail) {
  if (!article.cover_image) return [DEFAULT_SHARE_IMAGE];
  return [{ url: coverUrl(article.cover_image), alt: article.cover_alt ?? "" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await loadArticle((await params).slug);
  if (!article) return { title: "Article introuvable" };

  const url = `/blog/${article.slug}`;
  const images = shareImages(article);
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    authors: [{ name: article.author_name }],
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: [article.author_name],
      section: article.category,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images,
    },
  };
}

/** Structured data, so search engines show the article as one. */
function jsonLd(article: ArticleDetail): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: { "@type": "Person", name: article.author_name },
    articleSection: article.category,
    ...(article.cover_image && { image: coverUrl(article.cover_image) }),
  };
  // "<" escaped: the text can't close the <script> tag.
  return JSON.stringify(data).replaceAll("<", String.raw`<`);
}

export default async function ArticlePage({ params }: Props) {
  const article = await loadArticle((await params).slug);
  if (!article) notFound();

  const related = await loadRelated(article.id);
  const date = formatArticleDate(article.published_at);

  return (
    <main className="mx-auto max-w-[1440px] px-5 pt-6 pb-16 lg:px-[120px] lg:pt-10 lg:pb-24">
      <script
        type="application/ld+json"
        // Safe: built from JSON.stringify with "<" escaped above.
        dangerouslySetInnerHTML={{ __html: jsonLd(article) }}
      />

      <Link href="/blog" className="n-link-arrow text-(--n-neutral-400)!">
        <ArrowLeftIcon size={16} />
        Tous les articles
      </Link>

      <article className="mt-3 lg:mt-4">
        <header
          className="n-cover relative overflow-hidden rounded-[14px] flex flex-col justify-end min-h-[300px] lg:min-h-[400px]"
          style={categoryStyle(article.category)}
        >
          {article.cover_image && (
            <CoverImage
              image={article.cover_image}
              alt={article.cover_alt ?? ""}
              sizes="(min-width: 1440px) 1200px, 100vw"
              priority
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent"
          />
          <div className="relative flex flex-col gap-3 p-5 lg:gap-4 lg:p-10 max-w-[900px]">
            <CategoryBadge category={article.category} onCover />
            <h1 className="m-0 text-[28px] leading-[1.12] text-white lg:text-[44px]">
              {article.title}
            </h1>
            <p className="m-0 max-w-[62ch] text-[15px] leading-relaxed text-white/75 lg:text-[17px]">
              {article.excerpt}
            </p>
            <AuthorChip
              initial={initialOf(article.author_name)}
              name={article.author_name}
              readTime={readTimeLabel(article.read_minutes)}
              date={date}
              dateTime={article.published_at ?? undefined}
              onCover
            />
          </div>
        </header>

        <div className="mx-auto max-w-[68ch] mt-8 lg:mt-12">
          <ArticleBody markdown={article.body} />
          <div className="relative mt-10 pt-6">
            <div className="n-rule" />
            <ArticleActions
              articleId={article.id}
              slug={article.slug}
              likeCount={article.like_count}
            />
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-[68ch] mt-12 lg:mt-14">
        <Comments articleId={article.id} slug={article.slug} />
      </div>

      {related.length > 0 && (
        <section className="mt-14 lg:mt-20" aria-label="À lire ensuite">
          <SectionHeader title="À lire ensuite" href="/blog" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <SmallCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
