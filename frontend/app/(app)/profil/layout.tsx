import type { Metadata } from "next";

// The page is a client component: its tab title is declared here.
export const metadata: Metadata = {
  title: "Profil",
  description: "Votre identité, votre compte et votre session.",
};

export default function ProfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
