"use client";

import { useState } from "react";
import type { Article } from "@/app/(public)/blog/data";
import { HeroCard } from "@/app/ui/HeroCard/HeroCard";
import { ListCard } from "@/app/ui/ListCard/ListCard";
import { SmallCard } from "@/app/ui/SmallCard/SmallCard";
import { SectionHeader } from "@/app/ui/SectionHeader/SectionHeader";

const ALL = "Tout";

const RULE =
  "linear-gradient(to right, transparent, var(--n-divider) 48px, var(--n-divider) calc(100% - 48px), transparent) no-repeat bottom / 100% 1px";

interface BlogExplorerProps {
  articles: Article[];
  categories: string[];
}

/** Category filter + article lists of the blog page. */
export default function BlogExplorer({
  articles,
  categories,
}: BlogExplorerProps) {
  const [category, setCategory] = useState(ALL);

  const filtered =
    category === ALL
      ? articles
      : articles.filter((a) => a.category === category);
  const [featured, ...others] = articles;
  const headlines = others.slice(0, 4);
  const latest = others.slice(4);

  return (
    <>
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        {[ALL, ...categories].map((c) => (
          <button
            key={c}
            type="button"
            className="n-btn n-btn-secondary flex-none min-h-10 lg:min-h-9 px-3.5! text-[13px]! aria-pressed:text-(--n-accent)! aria-pressed:border-(--n-accent)!"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {category === ALL ? (
        <>
          <section
            className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10 mt-8 lg:mt-10"
            aria-label="À la une"
          >
            <HeroCard
              article={featured}
              showExcerpt
              className="min-h-[340px] lg:min-h-[460px]"
            />
            <div className="flex flex-col">
              <span className="n-eyebrow mb-1">À la une</span>
              {headlines.map((a, i) => (
                <div
                  key={a.id}
                  style={
                    i < headlines.length - 1 ? { background: RULE } : undefined
                  }
                >
                  <ListCard article={a} index={i} />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 lg:mt-16">
            <SectionHeader title="Derniers articles" count={latest.length} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latest.map((a) => (
                <SmallCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-8 lg:mt-10" aria-live="polite">
          <SectionHeader title={category} count={filtered.length} />
          {filtered.length === 0 ? (
            <p className="m-0 text-sm text-(--n-neutral-400)">
              Aucun article dans cette catégorie pour le moment.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((a) => (
                <SmallCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
