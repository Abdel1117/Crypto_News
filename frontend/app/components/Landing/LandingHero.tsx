"use client";

import Link from "next/link";
import { useAppSelector } from "@/app/lib/hooks";
import { PlayIcon } from "./LandingIcons";

export default function LandingHero() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const demoHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <section className="px-5 pt-11 lg:px-[120px] lg:pt-[104px]">
      <h1 className="m-0 text-[36px] leading-[1.1] tracking-[-0.02em]! lg:-ml-[0.06em] lg:max-w-[980px] lg:text-[68px] lg:leading-[1.07]">
        <span className="block">
          Suivez, analysez et simulez vos investissements crypto
        </span>
        <span className="block text-(--n-accent-400)">en temps réel.</span>
      </h1>
      <p className="mt-5 text-[15px] leading-6 text-(--n-neutral-300) lg:mt-[30px] lg:max-w-[60ch] lg:text-[17px] lg:leading-7">
        Crypto-Explorer est un tableau de bord crypto personnel — conçu pour
        suivre les marchés, simuler des stratégies et gérer votre watchlist,
        sans avoir besoin d’un compte broker.
      </p>
      <div className="flex flex-col gap-2.5 mt-6 lg:flex-row lg:mt-7">
        <Link
          href={demoHref}
          className="n-btn n-btn-primary n-btn-lg min-h-12 lg:min-h-0"
        >
          <PlayIcon />
          Lancer la démo
        </Link>
        <a
          href="#fonctionnalites"
          className="n-btn n-btn-secondary n-btn-lg min-h-12 lg:min-h-0"
        >
          Voir les fonctionnalités
        </a>
      </div>
    </section>
  );
}
