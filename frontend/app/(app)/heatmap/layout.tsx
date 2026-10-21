import type { Metadata } from "next";

// The page is a client component: its tab title is declared here.
export const metadata: Metadata = {
  title: "Heatmap du marché",
  description:
    "Les 50 plus grosses capitalisations crypto, colorées selon leur variation sur 24 h.",
};

export default function HeatmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
