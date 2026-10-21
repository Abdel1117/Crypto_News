import type { Metadata } from "next";

// The page is a client component: its tab title is declared here.
export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Vos favoris, le cours des cryptos, la heatmap et les plus fortes variations du marché.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
