"use client";
import Image, { StaticImageData } from "next/image";

import visaLogo from "@/public/images/payment_icons/logo-visa.png";
import paypalLogo from "@/public/images/payment_icons/pay-pal.png";
import cardLogo from "@/public/images/payment_icons/contactless.png";
import bitCoinLogo from "@/public/images/payment_icons/bitcoin.png";
import ProgresSale from "../ProgresSale/ProgresSale";
import { HeroCountDown } from "./HeroCountDown";
import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";

interface logoType {
  src: StaticImageData;
  alt: string;
}

const iconsList: logoType[] = [
  { src: visaLogo, alt: "Logo Visa" },
  { src: paypalLogo, alt: "Logo PayPal" },
  { src: bitCoinLogo, alt: "Logo Bitcoin" },
  { src: cardLogo, alt: "Paiement sans contact" },
];

export default function Hero() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const demoHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div id="section_hero">
      <div className="container max-w-7xl mx-auto px-1 lg:px-0 min-h-[400px] grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Text Block */}
        <div className="lg:col-span-2 self-center text-center lg:text-left">
          <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-6xl">
            Suivez, analysez et simulez vos investissements crypto
            <br />
            <span className="text-primary font-bold">en temps réel.</span>
          </h2>

          <p className="mt-0 mb-[20px] text-base leading-relaxed text-foreground">
            Crypto-Explorer est un tableau de bord crypto personnel — conçu pour
            suivre les marchés, simuler des stratégies et gérer votre watchlist,
            sans avoir besoin d&apos;un compte broker.
          </p>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-3">
            <Link href={demoHref}>
              <button className="flex items-center gap-3 rounded-full bg-primary px-6 py-4 font-bold text-foreground hover:bg-primary/80 transition hover:cursor-pointer">
                <svg
                  viewBox="0 0 330 330"
                  className="h-4 w-4 text-foreground shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
    c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
    C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z"
                    fill="currentColor"
                  />
                </svg>
                Lancer la démo
              </button>
            </Link>
            <a
              href="#product_description"
              className="rounded-lg border border-foreground/20 px-6 py-4 font-semibold text-foreground hover:border-primary hover:text-primary transition hover:cursor-pointer"
            >
              Voir les fonctionnalités
            </a>
          </div>
        </div>

        {/* Countdown Block */}
        <div className="lg:col-span-1">
          <div className="bg-surface text-center h-full lg:px-[30px] py-[40px] rounded-3xl">
            <h2 className="text-primary text-2xl lg:text-5xl font-bold">
              Accès bêta :
            </h2>

            <div className="mt-8 mb-12">
              <HeroCountDown />
            </div>
            <div className="my-8">
              <ProgresSale
                current={450000}
                goal={900000}
                label="Accès bêta activés"
                unit="utilisateurs"
              />
            </div>

            <div className="mt-6">
              <p className="text-xs text-muted mb-3 uppercase tracking-widest font-medium">
                Paiements — Bientôt disponibles
              </p>
              <div className="flex gap-2.5 flex-wrap justify-center items-center opacity-40 grayscale">
                {iconsList.map((val, index) => (
                  <Image
                    key={index}
                    width={30}
                    height={30}
                    src={val?.src as unknown as HTMLImageElement}
                    alt={val?.alt}
                    className="dark:bg-white px-0.5"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
