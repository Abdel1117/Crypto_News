import type { Metadata } from "next";

// The page is a client component: its tab title is declared here.
export const metadata: Metadata = {
  title: "Portefeuille virtuel",
  description:
    "Achetez et vendez des cryptos avec un capital fictif, aux prix réels du marché.",
};

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
