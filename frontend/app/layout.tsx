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
  title: "Crypto Front",
  description: "Crypto App",
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
