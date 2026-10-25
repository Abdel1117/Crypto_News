import type { Metadata } from "next";
import { ARTICLES, CATEGORY_META } from "./data";
import BlogExplorer from "@/app/components/Blog/BlogExplorer";

export const metadata: Metadata = {
  title: "Blog – Analyses et actualités crypto",
  description:
    "Retrouvez toutes nos analyses, guides et actualités sur les cryptomonnaies : Bitcoin, Ethereum, DeFi, NFT et bien plus.",
  openGraph: {
    title: "Blog Crypto-Explorer – Analyses et actualités crypto",
    description:
      "Retrouvez toutes nos analyses, guides et actualités sur les cryptomonnaies : Bitcoin, Ethereum, DeFi, NFT et bien plus.",
    url: "/blog",
  },
  twitter: {
    title: "Blog Crypto-Explorer – Analyses et actualités crypto",
    description:
      "Retrouvez toutes nos analyses, guides et actualités sur les cryptomonnaies.",
  },
};

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 pt-11 pb-16 lg:px-[120px] lg:pt-[72px] lg:pb-24">
      <header className="mb-8 lg:mb-10">
        <span className="n-eyebrow">Blog</span>
        <h1 className="mt-3.5 mb-0 text-[32px] leading-[1.1] lg:mt-4 lg:max-w-[20ch] lg:text-[44px]">
          Analyses et actualités{" "}
          <span className="text-(--n-accent-400)">crypto</span>
        </h1>
        <p className="mt-3.5 mb-0 max-w-[62ch] text-[15px] leading-6 text-(--n-neutral-300) lg:mt-5 lg:text-base lg:leading-7">
          Analyses, tutoriels et actualités sur Bitcoin, Ethereum, la DeFi et le
          Web3.
        </p>
      </header>

      <BlogExplorer
        articles={ARTICLES}
        categories={Object.keys(CATEGORY_META)}
      />
    </main>
  );
}
