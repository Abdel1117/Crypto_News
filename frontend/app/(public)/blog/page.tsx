import Link from "next/link";
import { ARTICLES, CATEGORY_META } from "./data";
import { HeroCard } from "@/app/ui/HeroCard/HeroCard";
import { SmallCard } from "@/app/ui/SmallCard/SmallCard";
import { ListCard } from "@/app/ui/ListCard/ListCard";
import { GridCard } from "@/app/ui/GridCard/GridCard";
import { SectionHeader } from "@/app/ui/SectionHeader/SectionHeader";
import { CategoryBadge } from "@/app/ui/CategoryBadge/CategoryBadge";
import { AuthorChip } from "@/app/ui/AuthorChip/AuthorChip";

export default function BlogPage() {
  const [featured, ...rest] = ARTICLES;
  const heroGrid = rest.slice(0, 4);
  const defiArticles = ARTICLES.filter(
    (a) => a.category === "DeFi" || a.category === "Ethereum",
  );
  const defiFeatured = defiArticles[0];
  const defiList = defiArticles.slice(1, 6);
  const nftArticles = ARTICLES.filter((a) => a.category === "NFT").slice(0, 3);
  const analyseArticles = ARTICLES.filter(
    (a) => a.category === "Analyse",
  ).slice(0, 3);
  const bitcoinFeatured = ARTICLES.find(
    (a) => a.category === "Bitcoin" && a.id !== 1,
  )!;
  const bitcoinList = ARTICLES.filter(
    (a) =>
      a.category !== "DeFi" &&
      a.category !== "NFT" &&
      a.id !== bitcoinFeatured?.id,
  ).slice(0, 5);
  const latest = ARTICLES.slice(6, 14);

  const categories = Object.keys(CATEGORY_META);

  return (
    <main className="bg-background min-h-screen page-transition">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        {/* ── Page title ───────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Blog & <span className="text-primary">Actualités</span> Crypto
          </h1>
          <p className="text-muted text-sm mt-1">
            Analyses, tutoriels et news sur Bitcoin, Ethereum, DeFi et le Web3.
          </p>
        </div>

        {/* ── Hero grid ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-10">
          <HeroCard
            article={featured}
            className="lg:col-span-3 min-h-[400px] lg:min-h-[460px]"
          />
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {heroGrid.map((a) => (
              <HeroCard key={a.id} article={a} className="min-h-[210px]" />
            ))}
          </div>
        </section>

        {/* ── Category pills ────────────────────────────────────── */}
        <section className="mb-10 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-1">
            <button className="px-4 py-1.5 rounded-full bg-primary text-black text-xs font-bold">
              Tout
            </button>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  className={`px-4 py-1.5 rounded-full bg-card border border-surface text-xs font-semibold ${meta.color} hover:border-current transition-colors`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── DeFi & Ethereum featured section ──────────────────── */}
        <section className="mb-12">
          <SectionHeader title="DeFi & Ethereum" href="#" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {defiFeatured && (
              <div className="lg:col-span-3">
                <Link
                  href={`/blog/${defiFeatured.id}`}
                  className="group relative overflow-hidden rounded-2xl flex flex-col justify-end min-h-[340px] block"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${defiFeatured.gradient}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="relative z-10 p-6">
                    <CategoryBadge category={defiFeatured.category} />
                    <h3 className="mt-2 text-white text-xl font-bold leading-snug group-hover:text-primary transition-colors">
                      {defiFeatured.title}
                    </h3>
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {defiFeatured.excerpt}
                    </p>
                    <AuthorChip
                      initial={defiFeatured.authorInitial}
                      name={defiFeatured.author}
                      date={defiFeatured.date}
                      readTime={defiFeatured.readTime}
                    />
                  </div>
                </Link>
              </div>
            )}
            <div className="lg:col-span-2 flex flex-col divide-y divide-surface">
              {defiList.map((a, i) => (
                <ListCard key={a.id} article={a} index={i} />
              ))}
              <Link
                href="#"
                className="text-xs text-primary hover:underline font-medium pt-4"
              >
                Voir tous les articles DeFi →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Two-column sections ───────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <SectionHeader title="NFT & Collectibles" href="#" />
            <div className="flex flex-col gap-5">
              {nftArticles.map((a) => (
                <GridCard key={a.id} article={a} />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader title="Analyse de marché" href="#" />
            <div className="flex flex-col gap-5">
              {analyseArticles.map((a) => (
                <GridCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Bitcoin & Altcoins featured section ───────────────── */}
        {bitcoinFeatured && (
          <section className="mb-12">
            <SectionHeader title="Bitcoin & Altcoins" href="#" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <Link
                  href={`/blog/${bitcoinFeatured.id}`}
                  className="group relative overflow-hidden rounded-2xl flex flex-col justify-end min-h-[340px] block"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${bitcoinFeatured.gradient}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="relative z-10 p-6">
                    <CategoryBadge category={bitcoinFeatured.category} />
                    <h3 className="mt-2 text-white text-xl font-bold leading-snug group-hover:text-primary transition-colors">
                      {bitcoinFeatured.title}
                    </h3>
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {bitcoinFeatured.excerpt}
                    </p>
                    <AuthorChip
                      initial={bitcoinFeatured.authorInitial}
                      name={bitcoinFeatured.author}
                      date={bitcoinFeatured.date}
                      readTime={bitcoinFeatured.readTime}
                    />
                  </div>
                </Link>
              </div>
              <div className="lg:col-span-2 flex flex-col divide-y divide-surface">
                {bitcoinList.slice(0, 5).map((a, i) => (
                  <ListCard key={a.id} article={a} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Promo banner ──────────────────────────────────────── */}
        <section className="mb-12">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/5 border border-primary/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
                Newsletter
              </p>
              <h3 className="text-foreground font-bold text-xl">
                Ne manquez aucune actualité crypto
              </h3>
              <p className="text-muted text-sm mt-1">
                Recevez les meilleures analyses directement dans votre boîte
                mail.
              </p>
            </div>
            <Link
              href="#contact"
              className="shrink-0 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-secondary transition-colors text-sm"
            >
              S'abonner gratuitement
            </Link>
          </div>
        </section>

        {/* ── Latest articles grid ──────────────────────────────── */}
        <section className="mb-12">
          <SectionHeader title="Derniers articles" href="#" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latest.map((a) => (
              <SmallCard key={a.id} article={a} />
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="px-8 py-3 rounded-xl border border-surface text-foreground text-sm font-semibold hover:border-primary hover:text-primary transition-colors">
              Charger plus d'articles
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
