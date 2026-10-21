import type { Metadata } from "next";
import "./globals.css";
import "./styles/nocturne.css";
import { inter } from "./styles/fonts";
import { ThemeScript } from "./components/ThemeScript/ThemeScript";
import { Providers } from "./providers/root-providers";
import TopLoader from "./components/TopLoader/TopLoader";
import { ConsentProvider } from "./context/Consent/ConsentContext";
import CookieBanner from "./components/CookieBanner/CookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Crypto-Explorer",
    template: "%s | Crypto-Explorer",
  },
  description:
    "Suivez l'actualité crypto en temps réel : prix, analyses de marchés, tendances Bitcoin, Ethereum et bien plus.",
  keywords: [
    "crypto",
    "cryptomonnaie",
    "bitcoin",
    "ethereum",
    "actualité crypto",
    "marchés crypto",
    "prix crypto",
  ],
  authors: [{ name: "Crypto-Explorer" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Crypto-Explorer",
    title: "Crypto-Explorer",
    description:
      "Suivez l'actualité crypto en temps réel : prix, analyses de marchés, tendances Bitcoin, Ethereum et bien plus.",
    images: [
      {
        url: "/images/01.png",
        width: 1200,
        height: 630,
        alt: "Crypto-Explorer – Actualité et marchés crypto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto-Explorer",
    description:
      "Suivez l'actualité crypto en temps réel : prix, analyses de marchés, tendances Bitcoin, Ethereum et bien plus.",
    images: ["/images/01.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <style
          dangerouslySetInnerHTML={{
            __html: `
               html:not(.dark) { color-scheme: light; }
               html.dark { color-scheme: dark; }`,
          }}
        />
      </head>

      {/* The whole site uses the Nocturne design system. */}
      <body className={`nocturne ${inter.variable} antialiased`}>
        <ConsentProvider>
          <Providers>
            <TopLoader />
            {children}
          </Providers>
          <CookieBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
