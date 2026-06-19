import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "./components/ThemeScript/ThemeScript";
import { Providers } from "./providers/root-providers";
import TopLoader from "./components/TopLoader/TopLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Crypto News",
    template: "%s | Crypto News",
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
  authors: [{ name: "Crypto News" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Crypto News",
    title: "Crypto News",
    description:
      "Suivez l'actualité crypto en temps réel : prix, analyses de marchés, tendances Bitcoin, Ethereum et bien plus.",
    images: [
      {
        url: "/images/01.png",
        width: 1200,
        height: 630,
        alt: "Crypto News – Actualité et marchés crypto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto News",
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
    <html lang="fr" className="light bg-background" suppressHydrationWarning>
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

      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "antialiased bg-background text-foreground",
        ].join(" ")}
      >
        <Providers>
          <TopLoader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
