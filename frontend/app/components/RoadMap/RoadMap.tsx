"use client";

import React, { useMemo, useRef } from "react";

type RoadMapItem = {
  year: string;
  description: string;
};

export default function RoadMap() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<RoadMapItem[]>(
    () => [
      {
        year: "2018",
        description:
          "Montée en charge, durcissement de la sécurité et extension progressive des services.",
      },
      {
        year: "2017",
        description:
          "Partenariats stratégiques et consolidation de la conformité (KYC/AML selon zones).",
      },
      {
        year: "2016",
        description:
          "Amélioration de l’expérience utilisateur, alertes et itérations sur les retours.",
      },
      {
        year: "2014",
        description:
          "Mise en place des fondations techniques : sécurité, monitoring et performances.",
      },
      {
        year: "2015",
        description:
          "Déploiement des premières fonctionnalités clés et ouverture de la bêta.",
      },
      {
        year: "2012",
        description:
          "Lancement du projet et premières validations produit avec la communauté.",
      },
    ],
    [],
  );

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.max(260, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === "left" ? -delta : delta,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto"
      aria-label="Roadmap"
    >
      <div className="text-center">
        <small className="text-base uppercase text-muted">Roadmap</small>
        <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-6xl">
          Notre feuille de route
        </h2>
        <p className="mt-4 text-muted max-w-3xl mx-auto">
          Une vue d’ensemble des étapes clés du projet, présentées sur une
          timeline.
        </p>
      </div>

      {/* Mobile (<lg): vertical */}
      <div className="mt-10 lg:hidden">
        <div className="relative pl-6">
          <div className="pointer-events-none absolute left-2 top-0 bottom-0 w-px bg-foreground/20" />
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.year} className="relative">
                <div className="absolute -left-[23px] top-[50%]">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />
                </div>
                <div className="rounded-2xl bg-card border border-foreground/10 p-5">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {item.year}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop (lg+): horizontal */}
      <div className="mt-10 relative hidden lg:block">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Roadmap précédente"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-primary text-black flex items-center justify-center shadow-lg hover:cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Roadmap suivante"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-primary text-black flex items-center justify-center shadow-lg hover:cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <div
          ref={scrollerRef}
          className="overflow-x-auto scroll-smooth no-scrollbar"
        >
          <div className="relative min-w-max px-16">
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/20" />

            <div className="relative flex gap-10 items-stretch py-10">
              {items.map((item, idx) => {
                const isTop = idx % 2 === 0;

                return (
                  <div
                    key={`${item.year}-${idx}`}
                    className="relative h-105 w-70 lg:w-85"
                  >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    </div>

                    <div
                      className={[
                        "absolute w-full",
                        isTop ? "top-0" : "bottom-0",
                      ].join(" ")}
                    >
                      <div className="relative rounded-2xl bg-card border border-foreground/10 p-6 shadow-lg">
                        <h3 className="text-3xl font-semibold text-foreground">
                          {item.year}
                        </h3>
                        <p className="mt-4 text-base leading-relaxed text-muted">
                          {item.description}
                        </p>

                        {isTop ? (
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-4 w-4 rotate-45 bg-card border-r border-b border-foreground/10" />
                        ) : (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-2 h-4 w-4 rotate-45 bg-card border-l border-t border-foreground/10" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
