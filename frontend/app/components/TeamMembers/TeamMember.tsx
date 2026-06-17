import React from "react";

export default function TeamMember() {
  return (
    <div id="teams_section">
      <div className="container max-w-7xl mx-auto px-1 lg:px-0">
        <div className="text-center mb-[60px]">
          <small className="text-base uppercase text-foreground">
            Derrière le projet
          </small>
          <h2 className="mt-3 mb-[20px] text-3xl font-semibold text-foreground sm:text-5xl">
            Construit Indépendamment
          </h2>
          <p className="px-2 md:px-12 lg:px-25 text-muted">
            CoinxEX est un projet personnel conçu et développé en solo — de
            l&apos;architecture backend à l&apos;interface utilisateur.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-surface rounded-3xl p-8 sm:p-12 max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-background">
              A
            </div>
            <h3 className="text-2xl font-semibold text-foreground">Abdel</h3>
            <p className="mt-1 text-sm font-semibold text-primary uppercase tracking-wide">
              Full Stack Developer
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Conception, développement et déploiement de CoinxEX — du backend
              Next.js / PostgreSQL à l&apos;interface React / Redux, en passant
              par l&apos;infrastructure Docker.
            </p>
            <div className="mt-6">
              <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Ouvert aux collaborations
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
