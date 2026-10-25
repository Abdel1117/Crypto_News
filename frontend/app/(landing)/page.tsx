import type { Metadata } from "next";
import LandingNav from "../components/Landing/LandingNav";
import LandingHero from "../components/Landing/LandingHero";
import DashboardPreview from "../components/Landing/DashboardPreview";
import BetaBand from "../components/Landing/BetaBand";
import {
  Contact,
  Features,
  LandingFooter,
  PartnersStrip,
} from "../components/Landing/LandingSections";

export const metadata: Metadata = {
  title: {
    absolute: "Crypto-Explorer – Actualité et marchés crypto en temps réel",
  },
  description:
    "Découvrez Crypto-Explorer : suivez les prix du Bitcoin, de l'Ethereum et de toutes les cryptomonnaies. Analyses, tendances et actualités en temps réel.",
  openGraph: {
    title: "Crypto-Explorer – Actualité et marchés crypto en temps réel",
    description:
      "Découvrez Crypto-Explorer : suivez les prix du Bitcoin, de l'Ethereum et de toutes les cryptomonnaies. Analyses, tendances et actualités en temps réel.",
    url: "/",
    images: [
      {
        url: "/images/01.png",
        width: 1200,
        height: 630,
        alt: "Crypto-Explorer – Accueil",
      },
    ],
  },
  twitter: {
    title: "Crypto-Explorer – Actualité et marchés crypto en temps réel",
    description:
      "Découvrez Crypto-Explorer : suivez les prix du Bitcoin, de l'Ethereum et de toutes les cryptomonnaies.",
  },
};

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-[1440px]">
        <LandingNav />
      </div>
      <main>
        <div className="mx-auto max-w-[1440px]">
          <LandingHero />
          <DashboardPreview />
          <PartnersStrip />
        </div>
        {/* Full-bleed band: the only saturated zone of the page. */}
        <BetaBand />
        <div className="mx-auto max-w-[1440px]">
          <Features />
          <Contact />
        </div>
      </main>
      <div className="mx-auto max-w-[1440px]">
        <LandingFooter />
      </div>
    </>
  );
}
