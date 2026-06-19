import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous ou créez votre compte Crypto News pour accéder à votre dashboard, suivre vos marchés et personnaliser votre expérience.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
